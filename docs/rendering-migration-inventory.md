# 描画の作り直し: 今の作りの洗い出し(2026-10-24)

共通の規約 `~/base/apps/.claude/rules/coding/rendering.md` に合わせるための下調べ。`/ui-tech` で設計とフェーズを決めるときの材料にする。

## 一言で

すべての画面が、表示の後にブラウザからデータを取っている(`HydratedOnly` と TanStack Query)。サーバーでのデータ取得・Server Action・`cacheComponents` はどれも無い。変わるファイルは、テストを含めて約80〜95(見積もり)。

## 規約とのずれ

| 規約 | 今 |
| --- | --- |
| `cacheComponents: true`・`partialPrefetching: true` | どちらも無い |
| 初期データはサーバーで取る | すべてブラウザ(`useSupabase()` のブラウザ用クライアント) |
| `loading.tsx` は置かない | `src/app/(main)/loading.tsx` がある |
| 更新は Server Action + `useOptimistic` | TanStack Query の mutation、成功後に invalidate。楽観的な更新は無い |
| URL で表せる状態は `searchParams` | 選んだ日・週は Jotai の atom(`selectedDateAtom`・`planWeekStartAtom`・`reportWeekStartAtom`) |
| `prefetch={true}` は一覧の行に付けない | レシピ・マスタ・セットの各行と「新規」ボタンに付いている |
| 知らない値は route の中で 404 | 詳細画面は見つからないとき部品の中で `NotFoundState` を出す |
| proxy は `getClaims()` | #7 で対応 |
| `is_member()` で利用者を確かめる | 無い(`public` スキーマの meshi-log) |

## 画面ごと

| 画面 | `HydratedOnly` | 読むもの | 書くもの |
| --- | --- | --- | --- |
| `/home` | あり | 食事・日の集計(RPC)・目標値。Drawer で履歴・レシピ・マスタ・セット | 登録・編集・削除・前日コピー・献立へ転記 |
| `/plan` | あり | 週の献立・目標値・買い物リスト。モーダルでレシピ・マスタ・セット | 献立の保存・削除・食事へ転記・同期 |
| `/recipes`・`/recipes/[id]` | なし | レシピ一覧(検索)・詳細 | 保存・削除 |
| `/other/food-masters`・`[id]` | なし | マスタ一覧(検索)・詳細 | 保存・削除 |
| `/other/set-menus`・`[id]` | 一覧のみ | セット一覧・詳細・レシピ・マスタ | 保存・削除 |
| `/other/report` | あり | 週の集計(RPC) | なし |
| `/other/settings` | あり | 目標値・メール | 目標値の保存・全データ削除・CSV 出力 |

レシピ・マスタ・セット・目標値は、複数の画面で同じものを読んでいる。

## 作り直しで気を付けること

- **「今日」の決め方**: 今はブラウザの時刻で決めている。サーバーで決めるならタイムゾーン(Asia/Tokyo)を明示する必要がある
- **Service Worker(`public/sw.js`)**: 画面の HTML をネットワーク優先でキャッシュしている。HTML に利用者のデータが入ると、その HTML がキャッシュに残る
- **更新の後に読み直す範囲**: 今もマスタ・レシピを変えても食事・献立を読み直していない。週の集計も食事の変更で読み直していない
- **隠れた画面が残る(Activity)**: E2E は `getByText` を多く使っていて、隠れた画面の要素にも当たる
- **`TabDataPrefetcher`**: 起動時に今日の食事・今週の献立・目標値を先に取っている。サーバーでの取得と先読みに置き換える
- **ブラウザでしか動かないもの**: OCR(tesseract.js)・CSV 出力・テーマ・Drawer の状態はクライアントに残す

## 壊れるテスト

data の hooks をモックしている単体テストが約13ファイル(meal-slot-card・meal-item-edit-modal・drawer の controller・各 selector・plan-weekly-summary・plan の menu select controller・shopping-list-dialog・danger-zone・settings-view など)。`use-list-cache-seed`・`hydrated-only`・日付の atom のテストは、仕組みごと無くなる。

## 規約の前提(supabase.md)

calorie は「次にフェーズを回すときに最初にそろえる」対象になっている。

- 本番のスキーマを `supabase db dump` で最初のマイグレーションにする
- `supabase/tests/verify_*.sql` を pgTAP に移す
- E2E をローカルの DB で流す形にする(今は本番の DB の E2E 用アカウントに当てている)
