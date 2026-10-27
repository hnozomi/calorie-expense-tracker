# 描画の作り直し 技術設計書

開いた直後とタブの切り替えで待たされるのを直すため、全画面を共通の規約 `~/base/apps/.claude/rules/coding/rendering.md` の作りに移す。画面の見た目と操作は変えない。

- 今の作りの洗い出し: `docs/rendering-migration-inventory.md`
- 画面の仕様: このアプリには `docs/ui-design.md` が無い(規約より前に作った)。見た目と操作は今の画面と `docs/02-screen-interaction.md` を正とする
- 要件: `docs/requirements.md` も無い。この作り直しで満たすことは下の「満たすこと」に書く。今の振る舞いは `docs/e2e-test-design.md` の E2E(A-1〜ST-3)が守る

## 満たすこと

| # | 満たすこと |
| --- | --- |
| AC-R-1 | 今の E2E(`docs/e2e-test-design.md` の §3)が、作りを変えたあともすべて通る |
| AC-R-2 | 画面を開いた最初の HTML に、その画面のデータ(食事・献立・一覧)が入っている。表示の後にブラウザから DB を読まない(OCR・ログインを除く) |
| AC-R-3 | 選んだ日・週が URL に出る(`/home?date=2026-10-20`、`/plan?week=2026-10-20`、`/other/report?week=2026-10-20`)。再読み込み・戻る・URL を開くで同じ日・週が出る |
| AC-R-4 | 一度開いたタブに戻ると、スケルトンを挟まずに前の表示が出る |
| AC-R-5 | 記録・削除などは、押した直後に画面に出る。失敗したら元に戻り、そばにエラーが出る |
| AC-R-6 | ある画面で変えたものが、別のタブに移ったときに反映されている(献立から転記した食事がホームに出る、マスタを直すとホームの値が変わる など) |
| AC-R-7 | 詳細画面で、無い id・消した id を開くと 404 になる |
| AC-R-8 | 速さ: `pnpm build && pnpm start` を Playwright で測り、タブの切り替えが今(0.2 秒未満)より遅くならず、開いた直後に本物のデータが出るまでが今(0.6〜1.4 秒)より短い |
| AC-R-9 | ログアウトしてから別の利用者でログインしても、前の利用者の食事・献立が、隠れて残る画面にも Service Worker のキャッシュにも残っていない(画面の HTML に利用者のデータが入るようになるため) |

## 0. スタック

足すもの・外すもの。

| もの | どうする | 理由 |
| --- | --- | --- |
| `cacheComponents`・`partialPrefetching`(next.config) | 入れる | 規約。App Shell をビルド時に作り、先読みで取る |
| Next.js 16.1 → 16.4.3、React 19.2 → 19.3 | 上げる(フェーズ 1) | `partialPrefetching` は 16.3 から。ほかのアプリと同じ版にそろえる |
| TanStack Query(`@tanstack/react-query`・devtools) | 最後のフェーズで外す | 初期データはサーバーで取り、更新は Server Action にするため、使う所が無くなる |
| Jotai | 残す | Drawer の開閉と、登録前のカード(`meal-register-atom`)はブラウザだけの状態。日付の atom だけ消す |
| tesseract.js・vaul・react-hook-form・zod | そのまま | ブラウザでしか動かない(OCR)か、作りに関わらない |

新しいライブラリは `server-only` だけ足す(フェーズ 2。サーバーで読む関数とサーバー用の Supabase クライアントを、Client から import したらビルドで止めるため。ほかのアプリと同じ版)。

## 1. ルーティング

パスは変えない。URL に日・週を足す。

| パス | 中身 | Server / Client | 動的 |
| --- | --- | --- | --- |
| `/home?date=` | 日の食事・集計・目標値、Drawer の候補 | ページは Server。日を変える・登録する部品が Client | `date` で変わる。無ければ今日(Asia/Tokyo) |
| `/plan?week=` | 週の献立・目標値・買い物リスト・献立の候補 | 同上 | `week` で変わる。無ければ今週の月曜 |
| `/recipes?q=`・`/recipes/[id]` | レシピの一覧(検索)・詳細 | 同上 | `q`・`id`。`id="new"` は新規 |
| `/other/food-masters?q=`・`/other/food-masters/[id]` | マスタの一覧(検索)・詳細 | 同上 | 同上 |
| `/other/set-menus`・`/other/set-menus/[id]` | セットの一覧・詳細 | 同上 | `id` |
| `/other/report?week=` | 週の集計 | 同上 | `week` |
| `/other/settings` | 目標値・メール・CSV・全削除 | 同上 | なし |
| `/other`・`/login`・`/signup`・`/offline` | データ無し | 今のまま | 静的 |

- `date`・`week`・`id` が形として正しくない、または見つからないときは、route の中で `notFound()` を返す(`dynamicParams` は使わない)
- `week` が月曜でないときは、その週の月曜に直して表示する(404 にしない)

## 2. ディレクトリ構成

機能ごとのフォルダに、サーバーで読む関数と Server Action を足す。アプリの規約(`.claude/rules/general.md` の `api/`)に合わせる。

```
src/components/features/<feature>/
  api/
    queries.ts     サーバーで読む関数。import "server-only"。'use cache: private' と cacheLife
    actions.ts     Server Action。"use server"。入力を zod で確かめ、revalidatePath する
  components/      Server の組み立て部品(<feature>-section.tsx など)と Client の末端
  hooks/           Client のロジック(useOptimistic・useTransition・フォーム)
```

全体で使うもの:

| ファイル | 中身 |
| --- | --- |
| `src/lib/supabase/server.ts` | 今のまま(cookie を読むサーバー用クライアント) |
| `src/utils/date.ts` | `getTodayInTokyo()`・`getThisMondayInTokyo()`・`getMondayOf()`(その日の週の月曜)を足す(サーバーで「今日」を決める) |
| `src/utils/search-params.ts` | `parseDateParam`・`parseWeekParam`(形を確かめ、週は月曜に直す) |
| `src/lib/revalidate-screens.ts` | `revalidateAllScreens()`(`revalidatePath("/", "layout")`)。全 Server Action が書き込みの成功の後に呼ぶ |
| `src/lib/revalidate.ts` | `revalidateApp()`。移行中のつなぎ専用(TanStack Query の画面から呼ぶ Server Action)。ログインを確かめてから `revalidateAllScreens()` |
| `src/lib/screen-cache.ts` | `SCREEN_CACHE`(`cacheLife` に渡す使い回しの時間) |
| `src/lib/today.ts` | `getToday()`。`'use cache: private'` の中で今日(Asia/Tokyo)を決める |
| `src/lib/action-result.ts` | `ActionResult`(Server Action の戻り値)と `callAction`(呼び出しの例外を `{ ok: false }` にする) |
| `src/lib/supabase/user.ts` | `getSignedInUserId()`(`getClaims` の `sub`) |
| `src/lib/legacy-bridge.ts` | 移行中だけ。`revalidateAfterLegacyMutation()` と `useRefreshLegacyScreens()`(フックだが、フェーズ 6 で消すので `src/hooks/` に移さない)。まだ TanStack Query の画面と、移した画面の読み直しをつなぐ(下の「移行中のつなぎ」)。最後のフェーズで消す |

消すもの(最後のフェーズまでに): `src/app/(main)/loading.tsx`、`layout/hydrated-only.tsx`、`layout/tab-data-prefetcher.tsx`、`hooks/use-list-cache-seed.ts`、`hooks/use-has-hydrated.ts`、`hooks/use-supabase.ts`、`hooks/query-keys.ts`、`hooks/use-nutrition-target.ts`、`hooks/use-date-navigation.ts`、`lib/create-week-start-atom.ts`、各機能の `queries.ts`・`stores/*-atom.ts`(日・週のもの)・取得と更新の hooks(`use-daily-meals` `use-save-recipe` など)、`app/providers.tsx` の QueryClientProvider。

## 3. コンポーネント設計

どの画面も同じ形にする。ホームを例に書く。

```
app/(main)/home/page.tsx                    Server。Header と <Suspense> を置くだけ
├─ Header「めしログ」                        Server。Suspense の外(すぐ出る)
└─ <Suspense fallback={DailySkeleton}>
    └─ DailySection                          Server。?date= を読み、今日を決める(形が違えば notFound)
        └─ <Suspense key={date} fallback={DailySkeleton}>
            └─ DailyContent                  Server。食事・集計・目標値を Promise.all で読む。Drawer の候補は Promise のまま渡す(await しない)
                └─ DailyMealsProvider        Client。useOptimistic の食事をスロット・集計・Drawer で共有(useDailyMealsContext)
                    ├─ DateNavigator         Client。前後の日と「今日へ」は <Link>(前後は prefetch)、日付の入力は router.push。useDateNavigator
                    ├─ DailySummary          Client。サーバーの集計に、保存中の変更の差分を足して出す(useDisplayedSummaryRows)
                    │   └─ DailySummaryCard  描画だけ
                    ├─ MealSlotList          Client
                    │   └─ MealSlotCard × 4  Client(描画だけ)。useMealSlot(前日コピー・献立へ転記・編集の開閉)
                    │       └─ MealItemEditModal  Client。useMealItemEdit
                    └─ MealRegisterDrawer    Client。useMealRegisterDrawerController
                        └─ CandidateSelector Client。use(promise) で候補を受ける(Suspense の中)
```

- **ページ**: Server。`searchParams` を読む部品を Suspense の中に置き、`key` に日・週・検索語を入れる
- **Section・Content**: Server。データを読み、Client の末端に props で渡す。ロジックを持たない
- **Client の末端**: 状態・イベントが要る所だけ。ロジックはフックに置く(`useDailyMealsContext` `useMealItemEdit` `useDateNavigator`)
- **集計の楽観表示**: 集計の正はサーバー(RPC)のまま。保存中の項目と確定した項目の差だけを足すので、保存が終われば数字はサーバーと一致する(`utils/adjust-summary-rows.ts`)
- **Server Action の呼び出しの失敗**: 通信が切れたときなどは呼び出しが例外になる。`callAction`(`src/lib/action-result.ts`)で `{ ok: false }` と同じ扱いにし、画面全体をエラーにしない
- **Drawer・モーダルの候補**: 開く前から要るが、画面の主な表示には要らない。Section で Promise を作って Client に渡し、Client の中で `use()` する。開くまでに読み終わり、開いた瞬間に出る
- 献立(`PlanSection` → `PlanCalendarGrid`・`PlanWeeklySummary`・買い物リスト・献立の候補)、一覧(`RecipeListSection` → 検索欄は Client で `?q=` を書き換える)、詳細(`RecipeFormSection` → `RecipeFormView` は Client のまま、初期値を props で受ける)も同じ形

## 4. 状態管理

| 状態 | 置き場所 | 今 |
| --- | --- | --- |
| 選んだ日・週 | URL(`?date`・`?week`) | Jotai の atom |
| 一覧の検索語 | URL(`?q`) | `useState` + debounce |
| 食事・献立・マスタ・レシピ・セット・目標値・集計 | サーバー(Server Component で読み、`'use cache: private'`) | TanStack Query |
| 押した直後の表示 | Client(`useOptimistic`) | 無し(成功後に読み直し) |
| Drawer の開閉・登録前のカード・OCR の結果 | Client 共有(Jotai) | 同じ |
| フォームの入力中 | Client ローカル(react-hook-form) | 同じ |

隠れて残る画面(Activity)の state:

- ホームの Drawer・編集モーダルは、タブを移ったら閉じる(隠れたときに `useLayoutEffect` の後始末で閉じる)
- 献立のメニュー選択と買い物リストのダイアログも、タブを移ったら閉じる(同じ作り。保存の失敗で開き直したダイアログが、戻ったときに開いて見えないように)
- 詳細画面の入力中は残す(戻ったら続きから)。保存したら一覧に移るので残らない
- 日・週・検索語は URL なので、Suspense の `key` で切り替わる

## 5. データ層

- 永続化先: Supabase の `public` スキーマ(今のまま。テーブル・RPC は変えない)
- 型: 各機能の `types/`(今のまま)。DB の行から型に直す関数は `queries.ts` から `api/queries.ts` に移す
- 読む: `api/queries.ts`。`'use cache: private'` + `cacheLife(SCREEN_CACHE)`(`{ stale: 300 }`。`'use cache: private'` はサーバーに残らずブラウザだけに置かれるので、効くのは `stale` だけ。ほかのアプリと同じ)。データはこのアプリの中からしか変わらず、記録はスマホからだけ(別の端末で足すことが無い)ため 300 秒(規約)
- 1回の表示で同じものを2か所から読むとき(目標値をホームの集計と Drawer で使う など)は、`cache` で包む
- 書く: `api/actions.ts`。入力を `unknown` で受けて zod で確かめ、今の更新(`from().insert/update/delete`・RPC)をそのまま呼び、書き込みが成功したら最後に `revalidateAllScreens()`(当たった行が0件なら失敗として返す)
- 「今日」: サーバーで `getToday()`(`src/lib/today.ts`)。`'use cache: private'` の中で `getTodayInTokyo()`(`Intl.DateTimeFormat` に `timeZone: "Asia/Tokyo"`)を呼ぶ。searchParams を読んだ後でも、dev の事前描画は `new Date()` を止めるため(規約)。使い回す時間は画面のデータと同じなので、0時をまたいだ直後は最大その時間だけ前の日のままになる
- ブラウザから DB を読むのは、ログイン・新規登録(`auth`)だけ残す

### 移行中のつなぎ

フェーズの途中は、移した画面(サーバーで読む)とまだの画面(TanStack Query)が混ざる。どちらで変えても、もう片方が古くならないようにする。

| 変えた側 | 古くなる側 | つなぎ方 |
| --- | --- | --- |
| まだの画面(TanStack Query の mutation) | 移した画面 | `providers.tsx` の `MutationCache` の `onSuccess` で、すべての mutation の成功後に `revalidateAfterLegacyMutation` を呼ぶ(mutation ごとに足さない)。`useMutation` でない全データ削除だけは直接呼ぶ |
| 移した画面(Server Action) | まだの画面 | Action を呼ぶ Client のフックが、成功後に `useRefreshLegacyScreens` ですべての query を invalidate する(表示していない query は印を付けるだけで、読み直すのは表示したとき) |

今も読み直していない組み合わせ(マスタを直してもホームの値が古い、食事を変えても週の集計が古い)は、`revalidateAllScreens` で全部読み直すので直る(AC-R-6)。

## 6. バックエンド

原則として変えない(フェーズ 4 のレシピの保存の RPC だけ例外。フェーズ 4 の項目を参照)。テーブル・RLS・RPC は変えない(#8 で本番のスキーマを最初のマイグレーションにし、pgTAP で確かめている)。`is_member()` が無いこと(共通の Auth の別のアプリの利用者も入れる)は、作りとは別の話なので、このフェーズには入れない。

## 7. PWA

- Service Worker(`public/sw.js`)の画面のキャッシュ(ネットワーク優先)はそのまま残す。オフラインで最後に見た画面を出すため
- 画面の HTML に利用者のデータが入るようになるので、ログアウトしたときに Service Worker のキャッシュを消す(`CLEAR_CACHE` のメッセージを足す)
- `CACHE_VERSION` を上げ、今のキャッシュ(データの無い HTML)を捨てる

## 8. エラー・空・ローディング

| 場面 | どこで出し分けるか |
| --- | --- |
| データを待つ | 各ページの `<Suspense>` の fallback。今のスケルトン(`DailySkeleton` `PlanSkeleton` など)を使い回す。見出しは Suspense の外 |
| 空(記録が無い日・献立が無い週・一覧が0件) | 今のまま部品の中 |
| 読めなかった | `src/app/error.tsx`(今のまま)。Section で例外を握りつぶさない |
| Drawer の候補が読めなかった | 例外にせず、Drawer の一覧の所に「一覧を読み込めませんでした」を出す(`hasError`)。候補は Drawer を開くまで要らず、手動入力は続けられるので、ホーム全体を error.tsx に替えない(ui.md「失敗した物のそばに出す」)。献立のメニュー選択(`PlanCandidateTabs`)と買い物リスト(`ShoppingListBody`)も同じく、ダイアログの中に出す |
| 押した後に失敗 | `useOptimistic` で元に戻り、toast を出す。登録は下書きを残したまま Drawer を開き直し、編集は打った値のまま編集の Drawer を開き直す(入力を消さない)。toast は品名入り(「「X」の更新に失敗しました」)、登録は「登録に失敗しました。もう一度お試しください」 |
| 前日をコピー | 楽観表示しない。前日の中身はブラウザに無く、出すには毎回前日も読むことになるため。押している間は「コピー中...」 |
| 今日の献立を転記・実績を反映・(ホームの)献立に反映 | 楽観表示しない。転記の結果は別のタブ(ホーム・献立)に出る。反映の中身は食事記録で、献立の画面のブラウザには無い。押している間は「転記中...」「反映中...」。転記は枠ごとに進むので、途中で失敗したら何枠移せたかを toast に出す |
| 無い id・形の違う日付 | route の中で `notFound()` → `src/app/not-found.tsx` |

## 9. 検討した代替案

| 案 | 採用しなかった理由 | 再検討するとき |
| --- | --- | --- |
| TanStack Query を残し、サーバーで `prefetchQuery` して `HydrationBoundary` で渡す | 規約(初期データは Server Component で取る、更新は Server Action)とずれる。キャッシュが2つ(Next と TanStack)になり、読み直しの漏れが今と同じく起きる | 別の端末からの変更をすぐ出したい(定期的な読み直し)が要るようになったとき |
| 全画面を1つの PR で作り直す | 約80〜95ファイルで、レビューも切り戻しもできない | なし |
| 読む関数を `src/db/` に集める(`supabase.md`) | このアプリの規約(`features/<feature>/api/`)と違う。アプリの規約を優先する決まり | アプリの規約を `src/db/` に寄せると決めたとき |
| Drawer の候補を、開いたときに Server Action で読む | 開いてから待つ。今の「開いた瞬間に出る」より遅くなる | 候補が多くなり、ホームの表示を重くするとき |
| 日・週を Jotai に残す | 再読み込み・戻るで日がずれる。サーバーで読む日が決められない | なし(決定済み) |

## 10. 実装フェーズ

各フェーズの最後に、`pnpm build && pnpm start` を Playwright で測り、PR に数字を書く(AC-R-8)。今の E2E はどのフェーズでも全部通す(AC-R-1)。

### フェーズ 1: 土台(cacheComponents を入れる)

画面の作りはまだ変えず、規約の仕組みだけを入れてビルドと E2E を通す。

- `next.config.ts`: `cacheComponents: true`・`partialPrefetching: true`
- `src/app/(main)/loading.tsx` を消す。各ページの Suspense で待つ
- ビルドで止まる所を直す(Suspense の外で cookie・時刻を読んでいる所)
- Next.js を 16.4.3 に上げる(`partialPrefetching` のため)
- 詳細画面(`[id]`)の `params` を Suspense の中で読む(`<feature>-form-section.tsx`)。下のタブはパスを読むので Suspense で包み、パスが決まらない間は選択なしのタブ(`BottomNavigationView`)を出す
- `src/utils/date.ts`(`getTodayInTokyo` など)・`src/utils/search-params.ts`・`src/lib/revalidate.ts`・`src/lib/legacy-bridge.ts`
- `providers.tsx` の `MutationCache` に `revalidateAfterLegacyMutation` をつなぐ
- E2E: 隠れて残る画面に当たらないよう、`getByText` を見えている要素に絞る(`e2e/helpers.ts` に `visible` の絞り込みを足す)
- `public/sw.js`: `CLEAR_CACHE` と `CACHE_VERSION` を上げる。ログアウトで呼ぶ(`src/lib/service-worker.ts` の `clearServiceWorkerCache`)
- ログアウトの後は `router.push` ではなく、ページを読み込み直して `/login` に移る(隠れて残る画面と TanStack Query のキャッシュを捨てるため)

確かめる流れ:
1. ホームで食事を記録し、献立タブに移ってからホームに戻ると、記録した食事がスケルトンを挟まずに出ている
2. ログアウトしてもう一度ログインすると、ホームに前の利用者の古い表示が出ない(AC-R-9)

学ぶこと: Cache Components(App Shell と動的な部分の分かれ目)、Activity で画面が隠れて残ること

### フェーズ 2: ホーム

- `/home?date=`。`meals/api/queries.ts`(日の食事・集計・履歴)・`settings/api/queries.ts`(目標値)・`recipes`・`food-masters`・`set-menus` の一覧の読み取り(Drawer の候補)
- `meals/api/actions.ts`: 登録(RPC)・編集・削除・前日コピー・献立へ転記
- `home/page.tsx`・`DailySection`・`DailyContent`・`DailyMealsProvider`(useOptimistic)・`DailySummary`・`MealSlotList`・`DateNavigator`(前後の日は `<Link prefetch>`、日付の入力は `router.push`。前後の日と同じく履歴に積み、戻るで前の日に戻れるようにする)
- 一覧の行の型への変換(`to-recipe` など)を各機能の `utils/` に出し、まだ TanStack Query の一覧画面と、サーバーで読む関数の両方から使う
- サーバーで読んだ画面の更新の後は、まだ TanStack Query の画面(献立・レポート)を `useRefreshLegacyScreens` で古い扱いにする
- 消す: `meals/queries.ts`・`stores/date-atom.ts`・`use-daily-meals` などの取得・更新の hooks・ホームの `HydratedOnly`。`TabDataPrefetcher` から食事を外す
- 単体テストを書き直す(`meal-slot-card`・`meal-item-edit-modal`・`use-meal-register-drawer-controller`・各 selector・`date-atom`・`date-navigator`)

確かめる流れ:
1. 前の日に移ると URL に日付が出て、再読み込みしても同じ日の食事が出る
2. 食事を登録すると、押した直後にスロットと集計に出る
3. ホームで「献立に反映」してから献立タブに移ると、反映した献立が出ている

学ぶこと: Server Action と `useOptimistic`、Promise を Client に渡して `use()` する、`'use cache: private'` と `cacheLife`

### フェーズ 3: 献立

- `/plan?week=`。`plan/api/queries.ts`(週の献立)・`plan/api/actions.ts`(保存・削除・食事へ転記・実績を反映)
- `PlanSection`(?week= を読み、月曜に直し、形が違えば notFound)→ `<Suspense key={weekStart}>` → `PlanContent`(献立・目標値を `Promise.all`、メニューの候補は Promise のまま)→ `WeeklyPlansProvider`(useOptimistic の献立を、グリッド・週のサマリー・セルのダイアログ・買い物リストで共有)
- `WeekNavigator`(Server): 前後の週は `<Link prefetch>`、`今週へ`は `<Link>`。今週の URL は `/plan`(`utils/plan-href.ts`)
- 買い物リストは、画面の献立と候補のレシピ(`use()`)から作る(開いたときに読まない)
- セルのダイアログは押した直後に閉じ、保存・削除が失敗したら打った値のまま開き直す(ホームの編集と同じ)
- 消す: `plan/queries.ts`・`stores/plan-week-atom.ts`・取得・更新の hooks。`TabDataPrefetcher` を消す
- 単体テストを書き直す(`plan-weekly-summary`・`use-plan-menu-select-controller`・`shopping-list-dialog`・`plan-week-atom`)

確かめる流れ:
1. 次の週に移ると URL に週が出て、戻るボタンで前の週に戻る
2. 献立で「今日の献立を転記」してからホームに移ると、転記した食事が出ている

学ぶこと: URL の値で中身が変わるリンクの先読み(`prefetch` を付ける所・付けない所)

### フェーズ 4: レシピ・食品マスタ

- `/recipes?q=`・`/recipes/[id]`・`/other/food-masters?q=`・`/other/food-masters/[id]`
- `recipes/api/{queries,actions}.ts`・`food-masters/api/{queries,actions}.ts`
- 一覧: `*-list-section.tsx`(?q= を読む)→ `<Suspense key={q}>` → `*-list-content.tsx`(全件を読んで `matchesSearch` で絞る。全件は他の画面と同じ private cache)。検索欄は共通の `ui/search-box`(打ち終わって少し後に ?q= を `router.replace`)で、keyed Suspense の外に置く(入力中にフォーカスと文字が消えないように)。行と「新規」の `prefetch` を外す
- 詳細: `new` は新規。uuid でない・無い・消した id は `notFound()`。マスタの新規は ?name= などの値(OCR から)をサーバーで読んで `prefill` で渡す。フォームの初期値は `useForm` の `defaultValues` で1回だけ入れる(effect で reset すると、隠れて残る画面に戻ったときに入力が消える。§4「詳細画面の入力中は残す」)
- 保存・削除の後は、Action が結果を返し、クライアントが toast を出して `router.push` で一覧へ。Action の中で `redirect` すると、クライアントの呼び出しが例外で終わり、成功の toast を出せないため
- レシピの保存の RPC は、消したレシピを更新しない(マイグレーション `keep_deleted_recipes_unsaved`。§6 の「RPC は変えない」の例外。編集中に別の所で消されたレシピを保存しても、保存できたことにしない)
- 消す: `use-recipe-detail`・`use-save-recipe`・`use-delete-recipe`・マスタの同じもの。`use-recipes`・`use-food-masters`・`use-list-cache-seed` はセットメニューが使うので、フェーズ 5 で消す
- 単体テストを書き直す(`recipe-card`・`food-master-card` が hooks に依っていれば)

確かめる流れ:
1. レシピを検索すると URL に検索語が出て、再読み込みしても同じ結果が出る
2. 食品マスタのカロリーを直してからホームに移ると、そのマスタで記録した食事の値が変わっている
3. 消したレシピの URL を開くと 404 が出る

学ぶこと: `notFound()` と Action の中の `redirect`、検索語を URL に置く

### フェーズ 5: セットメニュー・レポート・設定

- `/other/set-menus`・`/other/set-menus/[id]`・`/other/report?week=`・`/other/settings`
- `set-menus/api/{queries,actions}.ts`・`report/api/queries.ts`・`settings/api/{queries,actions}.ts`(目標値の保存・全データ削除・CSV の行を返す)
- ログアウトを `signOut({ scope: "local" })` にする(共通の Auth で、他のアプリのセッションまで切れるため。`supabase.md`)
- 消す: 各 hooks・`use-recipes`・`use-food-masters`・`use-list-cache-seed`(フェーズ 4 から持ち越し)・`report/queries.ts`・`report-week-atom.ts`・`settings/queries.ts`・残りの `HydratedOnly`
- 単体テストを書き直す(`danger-zone-section`・`settings-view`・各 chart が hooks に依っていれば)

確かめる流れ:
1. レポートで前の週に移ると URL に週が出て、その週の集計が出る
2. 目標カロリーを変えてからホームに移ると、集計の目標が変わっている

学ぶこと: 重い集計(RPC)を Suspense で包んで、見出しを先に出す

### フェーズ 6: 片付けと測定

- TanStack Query を外す(`providers.tsx`・`package.json`)。`legacy-bridge.ts`・`use-has-hydrated`・`hydrated-only`・`use-supabase`・`query-keys` を消す
- `CLAUDE.md` の Performance を新しい作りに書き直す(`useListCacheSeed`・`router.push` の話を消す)
- `docs/performance-issues-and-fixes.md` に、作り直しの前後の数字を書く
- `docs/rendering-migration-inventory.md` を消す(役目を終えるため)

確かめる流れ:
1. 4つのタブを順に開いてから、もう一度順に回ると、どのタブもスケルトンを挟まずに出る

学ぶこと: 作りを変えた前後の測り方(本番に近い条件で、何を測るか)
