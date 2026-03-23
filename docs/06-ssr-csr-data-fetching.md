# SSR/CSR データフェッチ設計ガイド

## 概要

Next.js App Router + TanStack Query における、サーバーサイドレンダリング（SSR）とクライアントサイドレンダリング（CSR）のデータフェッチの責務分離についてまとめる。

---

## 1. Next.js App Router のレンダリングモデル

### 1-1. Server Components と Client Components

Next.js App Router ではすべてのコンポーネントがデフォルトで **Server Component** として扱われる。
`"use client"` ディレクティブを付けた場合のみ Client Component になる。

| | Server Component | Client Component |
|---|---|---|
| 実行場所 | サーバーのみ | サーバー（初回SSR）+ クライアント |
| `async/await` | ✅ 使用可 | ❌ 使用不可 |
| `useState` / `useEffect` | ❌ 使用不可 | ✅ 使用可 |
| イベントハンドラ | ❌ 使用不可 | ✅ 使用可 |
| ブラウザAPI | ❌ 使用不可 | ✅ 使用可 |
| データフェッチ | `await fetch()` を直接呼べる | hooks 経由（useQuery 等） |
| バンドルサイズ | JS をクライアントに送らない | JS がクライアントに送られる |

**設計原則**: Server Component をデフォルトとし、インタラクションが必要な部分だけを Client Component に切り出す。「`use client` の境界をできるだけ末端に押し下げる」ことで、クライアントに送る JS 量を最小化する。

### 1-2. Static Rendering と Dynamic Rendering

Next.js はルートごとにレンダリング方式を自動判定する。

| | Static Rendering | Dynamic Rendering |
|---|---|---|
| 時期 | ビルド時 or revalidate 時 | リクエスト時 |
| キャッシュ | CDN にキャッシュ | キャッシュなし |
| 適用条件 | 動的関数を使わないルート | `cookies()`, `headers()`, `searchParams`, `connection()` を使うルート |
| 強制指定 | `export const dynamic = 'force-static'` | `export const dynamic = 'force-dynamic'` |

本プロジェクトのページは Supabase 認証（cookies）を使うため、すべて **Dynamic Rendering** となる。

### 1-3. Streaming とは

従来の SSR はページ全体のレンダリング完了を待ってからクライアントに送信していた。
Streaming では、準備ができた部分から順にクライアントに送信する。

```
従来の SSR:
サーバー: [データ取得 ─────────────] → [レンダリング ───] → [HTML 送信]
クライアント:                                               [受信 → 表示]

Streaming SSR:
サーバー: [静的シェル送信] → [データA取得] → [チャンクA送信] → [データB取得] → [チャンクB送信]
クライアント: [シェル表示]  → [A表示]                        → [B表示]
```

Streaming は `<Suspense>` 境界に沿って行われる。各 Suspense 境界は独立したストリーミングポイントであり、異なる境界内のコンポーネントは互いをブロックしない。

---

## 2. Suspense の仕組みと活用

### 2-1. Suspense の基本

React の `<Suspense>` は、子コンポーネントが「まだ準備できていない」状態の間、fallback UI を表示する仕組み。

```tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <>
      {/* 静的コンテンツ — 即座にクライアントに送信 */}
      <header>
        <h1>ダッシュボード</h1>
      </header>

      {/* 動的コンテンツ — データ取得完了後にストリーム */}
      <Suspense fallback={<ChartSkeleton />}>
        <StatsChart />
      </Suspense>
    </>
  );
}
```

コンポーネントが「まだ準備できていない」と判定されるケース:
- **Server Component**: `async` 関数の `await` が未完了
- **Client Component**: `useSuspenseQuery` が Promise を throw（データ未キャッシュ時）
- **React.lazy**: 遅延ロード中のコンポーネント

### 2-2. loading.tsx — ルートレベルの自動 Suspense

Next.js の `loading.tsx` ファイルは、そのルートセグメントの `page.tsx` を自動的に `<Suspense>` で囲む。

```
内部的な変換:
<Layout>
  <Suspense fallback={<Loading />}>    ← loading.tsx が自動で Suspense 境界になる
    <Page />
  </Suspense>
</Layout>
```

- ルート間のナビゲーション時に即座に fallback を表示
- ページ全体をカバーする粗い粒度の Suspense 境界
- より細かい制御が必要な場合は、ページ内で手動 `<Suspense>` を配置する

### 2-3. Suspense 境界の粒度設計

```
粒度が粗い（ページ単位）              粒度が細かい（セクション単位）
┌─────────────────────┐           ┌─────────────────────┐
│ <Suspense>          │           │ <header>即表示</header>│
│   <Header />        │           │ <Suspense>           │
│   <Summary />       │           │   <Summary />        │ ← 独立してストリーム
│   <List />          │           │ </Suspense>          │
│ </Suspense>         │           │ <Suspense>           │
│                     │           │   <List />           │ ← 独立してストリーム
│ 全体が一括でロード     │           │ </Suspense>          │
└─────────────────────┘           └─────────────────────┘
```

**設計指針**:
- 独立したデータソースを持つセクションは別々の Suspense で囲む → 並行ストリーミング
- 同じデータに依存するセクションは1つの Suspense にまとめる
- Suspense を増やすほどコードが複雑になるため、必要なところだけ分割する
- 遅いデータソースがある場合、そのセクションだけ分割すると他が先に表示されて UX 向上

### 2-4. Suspense が不要なケース

Suspense は万能ではない。以下のケースでは使わない方がよい:

- **検索UI**: 検索入力のたびに Suspend すると入力欄ごと fallback に置換される
- **条件付きフェッチ** (`enabled: false`): `useSuspenseQuery` は常にフェッチするため `enabled` オプションが使えない
- **オプティミスティックUI**: ユーザーアクション後の即時フィードバックが必要な場面

---

## 3. Server Component からのデータストリーミング

### 3-1. Promise を渡すパターン（Next.js 推奨）

Server Component でフェッチを開始し、`await` せずに Promise を Client Component に渡す。
Client Component 側で `React.use()` を使って resolve する。

```tsx
// Server Component — await しない
import { Suspense } from "react";

export default function Page() {
  const statsPromise = getStats(); // await しない → TTFB を改善

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <StatsChart dataPromise={statsPromise} />
    </Suspense>
  );
}
```

```tsx
// Client Component — use() で resolve
"use client";
import { use } from "react";

const StatsChart = ({ dataPromise }: { dataPromise: Promise<Stats> }) => {
  const stats = use(dataPromise); // Promise が resolve するまで Suspend
  return <Chart data={stats} />;
};
```

**メリット**: サーバーでフェッチを開始しつつ、HTML の送信をブロックしない（TTFB 最速）。
**注意**: TanStack Query と併用する場合はこのパターンではなく、prefetch + hydration パターンを使う。

### 3-2. await するパターン

Server Component でデータを `await` してから渡す。シンプルだが TTFB に影響する。

```tsx
export default async function Page() {
  const stats = await getStats(); // ここで完了を待つ
  return <StatsChart data={stats} />;
}
```

**使い分け**: 取得が速いデータ（< 100ms）なら await で十分。遅いデータは Promise パターンで。

---

## 4. TanStack Query + Next.js App Router 統合

### 4-1. prefetch → hydrate → useSuspenseQuery パターン

本プロジェクトで採用すべき推奨パターン。

```tsx
// 1. Server Component でプリフェッチ
export default async function Page() {
  const queryClient = getQueryClient();
  const supabase = await createClient();

  await queryClient.prefetchQuery({
    queryKey: ["meals", today],
    queryFn: () => fetchMeals(supabase, today),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<MealsSkeleton />}>
        <MealsView />
      </Suspense>
    </HydrationBoundary>
  );
}

// 2. Client Component で useSuspenseQuery
"use client";
const MealsView = () => {
  const { data } = useSuspenseQuery({
    queryKey: ["meals", today],
    queryFn: () => fetchMeals(supabase, today),
  });
  // data は guaranteed に存在 — undefined チェック不要
  return <MealList meals={data} />;
};
```

**フロー**:
1. Server Component が `prefetchQuery` でデータをサーバーキャッシュに格納
2. `dehydrate()` でキャッシュ状態をシリアライズ
3. `HydrationBoundary` がクライアントのキャッシュを復元
4. `useSuspenseQuery` はキャッシュにデータがあるため即座に返す（Suspend しない）
5. パラメータ変更時（日付変更等）は新しいキーのデータが未キャッシュなので Suspend → fallback 表示

### 4-2. Streaming without Prefetching（実験的）

`@tanstack/react-query-next-experimental` パッケージを使うと、プリフェッチなしで `useSuspenseQuery` をサーバーで実行し、結果をストリーミングできる。

```tsx
// app/providers.tsx
"use client";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration>
        {children}
      </ReactQueryStreamedHydration>
    </QueryClientProvider>
  );
};
```

- Server Component での `prefetchQuery` が不要になる
- Client Component で `useSuspenseQuery` を呼ぶだけで、サーバーでフェッチ → 結果をストリーム
- ただし **experimental** であり、本番での使用は慎重に判断する

### 4-3. useQuery vs useSuspenseQuery の使い分け

| 基準 | useSuspenseQuery | useQuery |
|------|------------------|----------|
| SSR プリフェッチ済み | ✅ 推奨 | 不要な isLoading が残る |
| パラメータがナビゲーション的（日付・週） | ✅ Suspend → fallback が自然 | 手動 isLoading と同等 |
| パラメータなし | ✅ 推奨 | 不要な isLoading が残る |
| 検索ドリブン（入力 → debounce → fetch） | ❌ 入力欄ごとfallbackに置換される | ✅ 推奨 |
| `enabled` 条件付き（詳細ページ等） | ❌ 常にfetchが走る | ✅ 条件付きフェッチが可能 |
| セレクター/モーダル（非プリフェッチ） | △ Suspense boundary 追加で可能 | ✅ 既存パターンで十分 |

**判断フロー**:

```
データはSSRでプリフェッチされる?
├── YES → パラメータは検索ベース?
│   ├── YES → useQuery + isLoading を維持
│   │         (検索入力のUXを守るため)
│   └── NO  → useSuspenseQuery + <Suspense> に変更
│             (コンポーネントからローディング分岐を排除)
└── NO  → enabled 条件がある?
    ├── YES → useQuery + isLoading を維持
    └── NO  → useQuery（セレクター等）or useSuspenseQuery + <Suspense>
```

### 4-4. QueryClient の初期化に関する注意

Suspense を使う場合、QueryClient の初期化方法に注意が必要。
React が初回レンダリング中に Suspend すると、Suspense 境界より上のステートが破棄される。

```tsx
// ❌ NG: useState で初期化 → Suspend 時に破棄される可能性
const Providers = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

// ✅ OK: モジュールスコープでシングルトン管理
let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
  if (isServer) return new QueryClient(); // サーバーは毎回新規
  if (!browserQueryClient) browserQueryClient = new QueryClient();
  return browserQueryClient; // ブラウザはシングルトン
}
```

### 4-5. staleTime の設定

SSR + Hydration を使う場合、`staleTime` を 0 より大きく設定しないと、クライアント側で即座にリフェッチが走る。

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60秒 — SSR 後の不要なリフェッチを防止
    },
  },
});
```

---

## 5. Partial Prerendering (PPR)

### 5-1. PPR とは

Next.js の Partial Prerendering は、1つのルート内で静的部分と動的部分を混在させる機能。

```
┌────────────────────────────────────┐
│ 静的シェル（ビルド時に生成、CDNキャッシュ）│
│ ┌──────────────────────────────┐   │
│ │ ヘッダー、ナビゲーション       │   │
│ └──────────────────────────────┘   │
│ ┌──────────────────────────────┐   │
│ │ <Suspense>                   │   │
│ │   動的コンテンツ              │   │ ← リクエスト時にストリーム
│ │   (ユーザー固有データ等)       │   │
│ │ </Suspense>                  │   │
│ └──────────────────────────────┘   │
└────────────────────────────────────┘
```

- 静的シェル（レイアウト、ナビ、Suspense の fallback）はビルド時に生成
- 動的部分（Suspense 内のコンポーネント）はリクエスト時にストリーム
- `<Suspense>` 境界が静的/動的の分割ラインになる

### 5-2. useSearchParams と Suspense

`useSearchParams()` を使う Client Component は、最も近い Suspense 境界までクライアントサイドレンダリングになる。
必ず `<Suspense>` で囲み、上位コンポーネントのプリレンダリングを守る。

```tsx
// ❌ NG: Suspense なし → ページ全体がクライアントレンダリングに
export default function Page() {
  return <SearchBar />;  // useSearchParams() を内部で使用
}

// ✅ OK: Suspense で囲む → SearchBar のみクライアントレンダリング
export default function Page() {
  return (
    <>
      <h1>検索</h1>  {/* プリレンダリング */}
      <Suspense fallback={<SearchBarSkeleton />}>
        <SearchBar />  {/* クライアントレンダリング */}
      </Suspense>
    </>
  );
}
```

---

## 6. 本プロジェクトへの適用

### 6-1. useSuspenseQuery に変更すべきフック

| フック | パラメータ | 使用コンポーネント | プリフェッチ |
|--------|-----------|-------------------|-------------|
| `useDailyMeals(date)` | 日付（ナビゲーション） | DailyView | ✅ home |
| `useDailySummary(date)` | 日付（ナビゲーション） | DailySummaryCard | ✅ home |
| `useNutritionTarget()` | なし | DailySummaryCard, PlanCalendarGrid, NutritionTargetSection | ✅ home, plan, settings |
| `useMealPlans(weekStart)` | 週（ナビゲーション） | PlanCalendarView | ✅ plan |
| `useSetMenus()` | なし | SetMenuListView | ✅ set-menus |
| `useWeeklyReport(weekStart)` | 週（ナビゲーション） | WeeklyReportView | ✅ report |

### 6-2. useQuery のまま維持すべきフック

| フック | 理由 |
|--------|------|
| `useRecipes(search)` | 検索ベース + RecipeSelector（非プリフェッチ）と共有 |
| `useFoodMasters(search)` | 検索ベース + FoodMasterSelector（非プリフェッチ）と共有 |
| `useRecipeDetail(id)` | `enabled: !!id && id !== "new"` 条件付き |
| `useFoodMasterDetail(id)` | 同上 |
| `useSetMenuDetail(id)` | 同上 |

### 6-3. Mutation hooks について

`useMutation` の `isPending` はフォーム送信中の状態表示（ボタンの disabled、ローディングテキスト等）で使用しており、SSR/CSR の責務分離とは無関係。変更不要。

---

## 7. リファクタリング手順

各フックを `useSuspenseQuery` に変更する際のチェックリスト:

1. **フック**: `useQuery` → `useSuspenseQuery` に変更（import も）
2. **コンポーネント**: `isLoading` 分岐を削除、`data` の `??` / `?` ガードを削除
3. **ページ（Server Component）**: `<Suspense fallback={<Skeleton />}>` で囲む
4. **Skeleton import**: コンポーネントから削除（Suspense fallback に移動するため）
5. **テスト**: モックの `isLoading` 状態テストがある場合は Suspense テストに変更
