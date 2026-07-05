# UX監査結果と修正計画(2026-07-05)

コードベース全体のUX監査で見つかった問題点の一覧と、フェーズ分けした修正計画。
各項目のチェックボックスは修正完了時にチェックする。

---

## 横断テーマ

1. **失敗の黙殺** — エラー時にユーザーへ何も表示されないパスが多数
2. **hover依存・タップ導線不足** — モバイルファーストPWAなのにhover前提のUIがある
3. **「今日/今週に戻る」導線が皆無** — 日次・週次ナビゲーションが◀▶のみ
4. **ダークモードが実質デッドコード** — ThemeProvider未マウント
5. **入力途中データの喪失** — 未保存警告なし、タブ切替でフォームが消える

---

## 問題点一覧

### 🔴 重大(データ破壊・信頼喪失)

| # | 問題 | 場所 |
|---|------|------|
| H1 | 下書きが食事スロット間でリーク。ドロワーを閉じても `draftItemsAtom` がクリアされず、別スロットにそのまま登録される | `src/components/features/meals/stores/meal-register-atom.ts:12`, `use-meal-register-drawer-controller.ts` |
| H2 | 既存献立を手動タブで編集するとPFCが0に上書きされ、レシピ等への参照も切断される | `plan-menu-select-modal.tsx:81`, `use-plan-menu-select-controller.ts:46-88` |
| H3 | レシピ/セットメニュー保存が非トランザクション(全削除→再挿入)。挿入失敗で材料が全消失 | `use-save-recipe.ts:46-75`, `use-save-set-menu.ts:64-99` |
| H4 | 「全データ削除」後にTanStack Queryキャッシュを無効化せず、削除済みデータが表示され続ける | `use-delete-all-data.ts` |
| H5 | 存在しない/削除済みIDの編集ページが空フォームになり、保存すると偽の成功トーストが出る | `use-food-master-detail.ts`, `use-recipe-detail.ts`, `use-set-menu-detail.ts` + 各 form-view |
| H6 | ログイン失敗が全て「メールアドレスまたはパスワードが正しくありません」に潰される(メール未確認・レート制限・通信障害も同じ) | `login-form.tsx:39-42` |
| H7 | 献立への一括転送(今日の実績に反映)が無フィードバック・エラー握りつぶし | `plan-weekly-summary.tsx:34-49` |
| H8 | ドロワー内ライブラリ画像OCRの失敗が無通知(スピナーが初期画面に戻るだけ) | `use-meal-register-drawer-controller.ts:108-117`, `meal-register-drawer.tsx:116-160` |
| H9 | OCR結果から「食品マスタに保存」するとスキャン・補正した値が全て捨てられ空フォームへ遷移 | `use-meal-register-drawer-controller.ts:119-125` |
| H10 | レポートのグラフ数値がhover時のみ表示。タッチデバイスでは日別数値を確認する手段がない | `weekly-calorie-chart.tsx:62`, `weekly-cost-chart.tsx:66`, `weekly-pfc-chart.tsx:81` |
| H11 | ダークモードが実質存在しない。ThemeProvider未マウント + `<html>` 背景白固定。`.dark` パレットと20ファイルの `dark:` バリアントがデッドコード | `src/app/layout.tsx:133`, `providers.tsx`, `globals.css:67`, `manifest.ts:11-12` |
| H12 | `error.tsx` / `not-found.tsx` が全ルートに存在せず、エラー・404でNext.jsデフォルトの英語画面が出る | `src/app/**` |

### 🟡 中程度(日常的なストレス)

| # | 問題 | 場所 |
|---|------|------|
| M1 | 「今日に戻る」ボタンがない。日付タップでピッカーも開かない | `date-navigator.tsx`, `use-date-navigation.ts` |
| M2 | 計画・レポートに「今週へ」ボタンがない。週ラベルに年・「今週」表示もない | `plan-calendar-view.tsx`, `weekly-report-view.tsx`, `date.ts:42-47` |
| M3 | 計画グリッドの食事ラベル列・日付ヘッダーが横スクロールで消える | `plan-calendar-grid.tsx:75-76` |
| M4 | 献立の削除に確認ダイアログがない | `plan-menu-select-modal.tsx:247-254` |
| M5 | 「献立に反映」がアイコンボタン即発火。確認もUndoもない | `meal-slot-card.tsx:37-47,79` |
| M6 | ログアウトに確認・ローディング状態・`router.refresh()` がない | `account-section.tsx:24-56` |
| M7 | 全データ削除ダイアログが失敗時(部分削除)にも閉じる | `danger-zone-section.tsx:30-34` |
| M8 | 未保存変更の警告がコードベース全体に存在しない(戻る矢印で即消失) | 各 form-view |
| M9 | ドロワーのタブ切替でフォームがアンマウントされ入力が消える(OCR補正値も) | `meal-register-drawer.tsx:104-115` |
| M10 | PFC入力のバリデーションエラーが画面に表示されず「保存が無反応」になる | `food-master-form-view.tsx:232-281`, `recipe-form-view.tsx:146-217`, `nutrition-form-fields.tsx` |
| M11 | 栄養目標フォームにバリデーションがなく、負数・空欄が0として黙って保存される | `nutrition-target-section.tsx:23-52` |
| M12 | 数値フィールドが初期値「0」で、消してから入力する必要がある | `manual-input-form.tsx:26`, `use-plan-menu-select-controller.ts:38-39` |
| M13 | 既存メールでのサインアップが偽の「確認メールを送信しました」成功画面になる(Supabaseの列挙対策仕様) | `signup-form.tsx:41-49` |
| M14 | 確認リンク切れ/使用済みで無言のままログイン画面へリダイレクト | `auth/callback/route.ts:11-17` |
| M15 | パスワード要件(8文字以上)の事前表示・表示/非表示トグルがない | `signup-form.tsx:133-145`, `login-form.tsx:93-104` |
| M16 | SW更新フローがない。`skipWaiting()`+`clients.claim()` で開きっぱなしのタブが壊れうる | `sw-register.tsx:7-9`, `public/sw.js` |
| M17 | 認証必須ルートをインストール時にプリキャッシュ → ログインHTMLが誤キャッシュされる。`addAll` は1つ失敗で全体失敗 | `public/sw.js:2-10` |
| M18 | オフライン専用ページがなく、未キャッシュルートは `/`(即リダイレクト)へフォールバック | `public/sw.js:59-63` |
| M19 | CSVエクスポートに期間指定がなく常に全件。共有 `isExporting` でどれが実行中か不明 | `csv-export-config.ts:36-55`, `csv-export-section.tsx:16-34` |
| M20 | メニュー選択リストに二度押し防止がなく献立が重複登録される | `plan-menu-select-modal.tsx:163-233`, `use-plan-menu-select-controller.ts:90-146` |
| M21 | レポートの空週に「データがありません」表示がない | `weekly-report-view.tsx:60-104` |
| M22 | 週次目標比較が `日次目標×7` 固定で、計画途中の週が「目標内」のように青字表示される | `plan-weekly-summary.tsx:52-55,108-145` |

### 🟢 軽微(改善推奨)

| # | 問題 | 場所 |
|---|------|------|
| L1 | セットメニュー一覧・セットメニュータブに検索がない(食品マスタ/レシピにはある) | `set-menu-list-view.tsx`, `set-menu-selector.tsx` |
| L2 | 食品マスタ検索が名前のみでブランド名にヒットしない | `use-food-masters.ts:20-22` |
| L3 | 一覧に件数制限・ページングがなく全件フェッチ | `use-food-masters.ts`, `use-recipes.ts`, `use-set-menus.ts` |
| L4 | 並び順が `updated_at desc` 固定。編集のたび先頭にジャンプ | 同上 |
| L5 | レシピ栄養成分が「合計」ラベルなのに手入力(コストのみ自動計算) | `recipe-form-view.tsx:134`, `use-recipe-form-controller.ts:116-123` |
| L6 | 目標未設定の新規ユーザーに設定画面への誘導がない | `daily-summary-card.tsx:157-173` |
| L7 | 計画グリッドの「今日」ハイライトが `bg-primary/[0.02]` でほぼ視認不能 | `plan-calendar-grid.tsx:126,162` |
| L8 | 計画セルのタップターゲットが44px基準を大幅に下回る | `plan-cell.tsx:34-49` |
| L9 | グリッド合計の赤/黄色分けに凡例がない | `plan-calendar-grid.tsx:167-194` |
| L10 | 食品マスタ/レシピ選択で追加時トーストや選択済み表示がなく二度タップで重複しうる | `use-meal-register-drawer-controller.ts`, 各 selector |
| L11 | 空のセットメニューをタップしても無反応(early return) | `set-menu-selector.tsx:24` |
| L12 | OCRが何も抽出できなくても成功と見分けがつかず0kcalエントリを生む | `ocr-parser.ts:45-76`, `ocr-camera-overlay.tsx:32-36` |
| L13 | 削除確認文がセットメニューからの参照に触れていない | 各 form-view の AlertDialog |
| L14 | 空データのCSVエクスポートがヘッダーのみのファイルで「成功」トーストを出す | `use-csv-export.ts:24-27` |
| L15 | 「キャッシュクリア」に確認なし・バージョン `v1.0.0` ハードコード | `app-info-section.tsx:12-35` |
| L16 | トーストが `top-center` でsticky headerと重なる。Toasterが `(main)` のみで認証画面はトースト不可 | `(main)/layout.tsx:14` |
| L17 | プッシュ通知に `notificationclick` ハンドラがなくタップしても開かない | `public/sw.js:90-98` |
| L18 | `(main)/loading.tsx` がヘッダー分のレイアウトを再現せず遷移時にガタつく | `src/app/(main)/loading.tsx` |
| L19 | コスト・PFCチャートのバーが `<div>` でスクリーンリーダーに情報が渡らない | `weekly-cost-chart.tsx:61`, `weekly-pfc-chart.tsx:76` |
| L20 | マニフェストに `id` / `scope` / `lang` / `dir` がない | `src/app/manifest.ts` |
| L21 | ログイン/サインアップ画面で不要な `getUser()` 通信が走る | `use-auth.ts:15-32` |

### ✅ 問題なしと確認済みの点

- バリデーションメッセージの日本語化、数値入力の `inputMode` 指定
- 保存/削除ボタンのpending制御とスピナー(マスタCRUD)
- マスタCRUDの成功トースト+一覧復帰、空状態CTA
- 全データ削除の「全データ削除」タイプ確認ゲート
- CSVのBOM付与、タイムゾーン安全な日付処理
- ボトムナビのアクティブ状態・safe-area対応

---

## 修正計画

依存関係と影響度でフェーズ分け。各フェーズ完了ごとに `pnpm build` + `pnpm test:run` を実行し、
プッシュ後は Vercel デプロイを確認する(CLAUDE.md のデプロイチェックリスト準拠)。

### Phase 1: データを黙って壊すバグの修正(最優先)

DBスキーマ変更(RPC追加)を含むため、Supabaseマイグレーションは実DBスキーマで検証してから適用する。

- [x] **1-1 (H1)** 下書きリーク修正: ドロワーの `onOpenChange(false)` と `drawerMealTypeAtom` 変更時に `draftItemsAtom` をリセット。下書きが残っている状態で閉じる場合は「入力中の内容を破棄しますか?」の確認を挟む(M9の一部を兼ねる)
- [x] **1-2 (H2)** 手動タブでのPFC破壊修正:
  - 既存プラン編集時は元の P/F/C と `recipeId/foodMasterId/setMenuId` を保持したまま名前/カロリー/コストのみ更新
  - あわせて手動タブに P/F/C 入力欄を追加(任意入力、デフォルト0)→ M22 の集計精度も改善
- [x] **1-3 (H3)** レシピ/セットメニュー保存のトランザクション化: `save_recipe_with_ingredients` / `save_set_menu_with_items` RPC(PostgreSQL関数)を作成し、削除+挿入を単一トランザクションに。フロントは `.rpc()` 呼び出しへ置換(マイグレーション適用済み: `20260705000000_transactional_recipe_set_menu_saves.sql`)
- [x] **1-4 (H4, M7)** 全データ削除の後始末: 成功時に `queryClient.clear()`(または全キー invalidate)。`deleteAllData` がエラーを rethrow するよう変更し、失敗時はダイアログを開いたまま部分削除の可能性を明示
- [x] **1-5 (H5)** 不正ID編集ページ: 詳細クエリのエラー/0件時に「データが見つかりませんでした」表示+一覧へ戻るボタン。3機能(food-masters / recipes / set-menus)共通で対応(`maybeSingle()` 化+共通 `NotFoundState` コンポーネント追加)
- [x] **1-6 (H7)** 献立転送: `try/catch` + 成功/失敗トースト追加、実行中はボタン disabled。部分失敗時は何件成功したかを表示

### Phase 2: エラーの可視化と全体基盤

- [ ] **2-1 (H12)** ルート境界の追加: `src/app/error.tsx`(グローバル)、`src/app/not-found.tsx`、動的ルート3箇所(`recipes/[id]` 等)に `not-found.tsx`。日本語コピー+ホームへ戻る導線
- [ ] **2-2 (H6)** ログインエラーの分類: Supabaseエラーコード(`email_not_confirmed` / `over_request_rate_limit` / ネットワーク)で分岐し、それぞれ適切な日本語メッセージを表示
- [ ] **2-3 (M13, M14)** サインアップ/コールバック改善:
  - サインアップ成功画面の文言を「既に登録済みの場合、メールは届きません。ログインをお試しください」を含む形に変更(列挙対策と両立)
  - コールバック失敗時は `/login?error=confirmation_failed` へリダイレクトし、ログイン画面でメッセージ表示
- [ ] **2-4 (M15)** パスワード欄: 「8文字以上」のヘルパーテキスト+表示/非表示トグルを login/signup 両方に追加
- [ ] **2-5 (H8, H9, L12)** OCRフィードバック:
  - ドロワーOCRタブにエラー表示ブランチを追加
  - `handleSaveToMaster` で `_values` をクエリパラメータ or atom 経由で新規マスタフォームに引き継ぎ、初期値として展開
  - 全フィールド `null` の場合は「栄養成分を読み取れませんでした。手動で入力してください」を表示
- [ ] **2-6 (H11)** ダークモード対応(推奨: 実装する):
  - `next-themes` の `ThemeProvider`(`attribute="class"`, `defaultTheme="system"`)を `providers.tsx` に追加
  - `layout.tsx` の白固定 style を削除し、`theme_color` を `media` 属性付き meta で両対応
  - 設定画面にテーマ切替(システム/ライト/ダーク)を追加
  - ※実装しない判断をする場合は `dark:` バリアントと `.dark` パレットを削除して割り切る

### Phase 3: ナビゲーションと操作フィードバック

- [ ] **3-1 (M1)** 日付ナビ: 中央の日付表示をタップ可能にして `<input type="date">` ピッカーを開く+今日以外を表示中は「今日へ」ボタンを表示(`isDefaultValue` は既存)
- [ ] **3-2 (M2)** 週ナビ: 計画・レポート両方に「今週へ」ボタン。週ラベルに年を含め(`2026/3/23 - 3/29`)、今週表示中は「今週」バッジ
- [ ] **3-3 (M3, L7)** 計画グリッド: 食事ラベル列と日付ヘッダー行を sticky 化。「今日」列のハイライトを視認可能な濃度に変更
- [ ] **3-4 (M4, M5, M6)** 破壊的操作の確認: 献立削除・「献立に反映」・ログアウトに AlertDialog を追加。ログアウトは pending 中 disabled + `router.refresh()`
- [ ] **3-5 (M20, L10)** 二度押し・重複防止: メニュー選択リストと食品マスタ/レシピ選択行を `isPending` 中 disabled に。追加時に軽いトースト or 行の選択済み表示
- [ ] **3-6 (M10, M11)** バリデーション表示:
  - PFC/カロリー入力欄すべてに `errors.*` メッセージ表示を追加(food-master / recipe / nutrition-form-fields)
  - 栄養目標フォームを zod スキーマ化(min/max、空欄エラー)し、インラインエラー表示
- [ ] **3-7 (M8, M9)** 入力喪失防止:
  - フォームの戻る矢印を `isDirty` 時に確認ダイアログ化(共通フックとして `useUnsavedChangesGuard` を `src/hooks/` に追加)
  - ドロワーのタブパネルを条件レンダリングから CSS 非表示(`hidden`)に変更してフォーム状態を保持
- [ ] **3-8 (M12)** 数値初期値: デフォルト `0` をやめ空文字+placeholder に(zod で空→undefined→必須エラー or 0 扱いを明示)。フォーカス時全選択でも可
- [ ] **3-9 (H10, M21, L19)** レポート改善:
  - バーをタップで数値表示(選択状態をローカルstateで保持)、または数値を常時表示
  - 週に記録ゼロなら「この週の記録はありません」空状態を表示
  - 全チャートのバーに `aria-label`(「3/24 月曜 1,850kcal」形式)を付与
- [ ] **3-10 (M22)** 週次目標比較: 計画が入っている日数×日次目標で比較するか、「7日中N日計画済み」を明記

### Phase 4: PWA・その他改善

- [ ] **4-1 (M16)** SW更新フロー: `skipWaiting` を即時実行せず waiting 状態で保持し、`updatefound` 検知で「新しいバージョンがあります」トースト+タップで `SKIP_WAITING` メッセージ→`controllerchange` でリロード
- [ ] **4-2 (M17, M18)** キャッシュ戦略修正: 認証必須ルートをプリキャッシュから外し、静的アセット+専用 `/offline` ページのみプリキャッシュ。ナビゲーション失敗時は `/offline` へフォールバック。`addAll` を個別 `add` + 失敗許容に
- [ ] **4-3 (L17)** `notificationclick` ハンドラ追加(既存ウィンドウ focus / なければ open)
- [ ] **4-4 (M19, L14)** CSVエクスポート: 食事データに期間選択(今月/先月/全期間)を追加。ボタンごとの実行中表示(「エクスポート中…」)。0件時は「データがありません」info トースト
- [ ] **4-5 (L16, L18)** トースト位置を `bottom-center`(ボトムナビ上、safe-area 考慮)へ変更し、Toaster をルートレイアウトへ移動。`(main)/loading.tsx` にヘッダープレースホルダを追加
- [ ] **4-6 (L1, L2)** 検索改善: セットメニュー一覧・セレクタに検索追加。食品マスタ検索を `name` + `brand` の OR 検索に
- [ ] **4-7 (L4, L3)** 一覧の並び順を名前順に変更(または選択可能に)。件数が問題になったら `.range()` ページング導入(現状は保留可)
- [ ] **4-8 (L6, L9, L11, L13, L15, L20)** 小改善まとめ:
  - 目標未設定時のサマリーカードに「目標を設定する」リンク
  - グリッド色分けの凡例(または合計セルに目標比テキスト)
  - 空セットメニュータップ時に「メニューが空です」トースト
  - 削除確認文にセットメニュー参照への言及追加
  - キャッシュクリアに確認+完了後リロード案内、バージョンを `package.json` から注入
  - マニフェストに `id` / `scope` / `lang: "ja"` を追加
- [ ] **4-9 (L5, L8, L21)** 残タスク: レシピ栄養の材料からの自動計算(食品マスタ由来の材料のみ合算+手動上書き可)、計画セルのタップターゲット拡大、認証フォームの不要な `getUser()` 削減

### 検証方針

- 各フェーズ完了時: `pnpm lint` → `pnpm test:run` → `pnpm build` を必ず通す
- Phase 1 の RPC はマイグレーション適用前に実スキーマで動作確認(CLAUDE.md の Supabase ルール準拠)
- Phase 2 のダークモード・エラーページ、Phase 4 の SW 変更は実機/ブラウザで目視確認
- push 後は Vercel のデプロイステータスを確認
