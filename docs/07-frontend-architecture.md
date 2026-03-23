# フロントエンド設計ガイド

## 概要

リファクタ後のフロントエンド実装ルールをまとめる。
目的は以下の3点。

- データ取得責務の重複を防ぐ
- 画面コンポーネントの肥大化を防ぐ
- 新規機能追加時に同じ構造を再利用できるようにする

---

## 1. 基本方針

### 1-1. 役割の分離

各 feature は次の責務に分ける。

| 層 | 主な責務 |
| --- | --- |
| `app/*/page.tsx` | `searchParams` 解決、server prefetch、`HydrationBoundary` 配置 |
| `components/features/*/queries.ts` | TanStack Query の `queryOptions` と row -> domain model 変換 |
| `components/features/*/hooks/use-*-controller.ts` | UI 状態、フォーム状態、保存/削除/OCR などの操作フロー |
| `components/features/*/components/*.tsx` | 表示、イベント接続、レイアウト |
| `utils/*` | feature をまたいで使う日付整形や CSV 変換など |

### 1-2. Client Component を増やしすぎない

- page は可能な限り Server Component に保つ
- `use client` はインタラクションが必要な箇所だけに付ける
- データ取得のためだけに page 全体を Client Component にしない

---

## 2. データ取得ルール

### 2-1. 推奨フロー

本プロジェクトでは以下を標準とする。

1. page で `QueryClient` を作る
2. page で `prefetchQuery(...)` を実行する
3. `HydrationBoundary` で包む
4. Client Component 側は `useSuspenseQuery(...)` を使う

このとき、query 定義は page と hook で重複させず、`queries.ts` に集約する。

```tsx
// page.tsx
await queryClient.prefetchQuery(getDailyMealsQueryOptions(supabase, date));
```

```tsx
// hook
return useSuspenseQuery(getDailyMealsQueryOptions(supabase, date));
```

### 2-2. `useSuspenseQuery` の扱い

`useSuspenseQuery` を使うコンポーネントでは、基本的に以下をしない。

- `data ? ... : <Skeleton />`
- `isLoading` 分岐
- `data?.x ?? fallback` のような防御的分岐

理由:
- fallback は `Suspense` 側が担当するため
- `data` は取得成功時点で必ず存在するため

### 2-3. 検索 UI は `useQuery`

検索入力や `enabled` 制御が必要な画面では `useQuery` を使う。

対象例:
- レシピ検索
- 食品マスタ検索
- モーダル内の絞り込み検索

---

## 3. Controller パターン

### 3-1. どんなときに導入するか

以下の条件が2つ以上ある場合、view から controller hook を分離する。

- `useState` が複数ある
- `useForm` と外部 state を併用している
- 保存/削除/OCR/ファイル選択など操作フローがある
- `router.push` / `toast` / mutation が混在している
- render 中にデータ初期化をしてしまいそうになる

### 3-2. controller の責務

controller hook は以下を返す。

- 表示に必要な state
- form object
- mutation state
- `handleSave`, `handleDelete`, `handleOcrResult` などの action

view は「どの action をどの UI に結びつけるか」だけを持つ。

### 3-3. 既存の適用箇所

現在は以下が controller パターンへ移行済み。

- `useRecipeFormController`
- `useFoodMasterFormController`
- `useSetMenuFormController`
- `useMealRegisterDrawerController`
- `usePlanMenuSelectController`

---

## 4. 日付・週ナビゲーション

### 4-1. ルール

日付や週の移動ロジックは view に直接書かず、共通 hook と util を使う。

使用先:
- `useSelectedDateNavigation`
- `useWeekStartNavigation`
- `formatDisplayDate`
- `formatWeekLabel`
- `buildWeekDays`
- `getTodayString`

### 4-2. URL 同期

URL クエリの更新も navigation hook 側で行う。

期待する効果:
- view から `router.replace(...)` が消える
- date/week ラベル生成が散らばらない
- ルートの既定値扱いを統一できる

---

## 5. 集計処理

### 5-1. render 中に同じ配列を何度も走査しない

週次カレンダーのような UI では、描画前に index を作る。

悪い例:
- `plans.filter(...)` をセルごとに繰り返す
- 日別合計を `map + filter + reduce` で毎回計算する

良い例:
- `plansBySlot`
- `totalsByDate`

のような Map を先に作り、描画時は lookup のみ行う。

---

## 6. CSV Export ルール

CSV export は hook 内にクエリやヘッダ定義を直接並べない。

構成:

- `csv-export-config.ts`
  - export 種別
  - ヘッダ
  - fetchRows
  - ファイル名 prefix
  - 成功メッセージ
- `useCsvExport.ts`
  - 実行制御
  - loading state
  - toast
  - `downloadCsv(...)`

これにより、新しい export 種別を追加するときは config を1件足せばよい。

---

## 7. 実装チェックリスト

新しい feature を追加するときは以下を確認する。

### データ取得

- query は `queries.ts` にあるか
- page と hook で query 定義を重複していないか
- `useSuspenseQuery` 配下に不要な loading 分岐が残っていないか

### UI 構造

- view が router / toast / mutation / OCR / file input を抱えすぎていないか
- state が増えたら controller へ分離しているか
- section 単位で読みやすく分割されているか

### パフォーマンス

- render 中に同じ配列を何度も `filter` / `reduce` していないか
- URL 同期や date 計算を毎画面で重複していないか

### アクセシビリティ

- `DialogContent` / `DrawerContent` に title / description があるか
- ボタンに role/label が必要な場面で不足していないか

---

## 8. 今後の運用

今後のリファクタや新規実装では、まず以下を判断する。

1. これは query 化すべき責務か
2. これは controller に置くべき責務か
3. これは view に残してよい責務か

この判断を先に行うことで、再び「大きい component に何でも入る」状態へ戻るのを防ぐ。
