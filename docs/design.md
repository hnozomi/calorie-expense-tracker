# めしログ（MeshiLog）技術設計書

## Context

めしログは毎日の食事を記録してカロリー・PFC・食費を管理するパーソナルPWA。Notionの設計書（docs/配下）をベースに、既存のNext.js PWAテンプレート上に技術設計を行う。

---

## 1. ルート構成

```
src/app/
├── layout.tsx                    # Root layout (Server) - 既存を更新
├── globals.css                   # 既存
├── manifest.ts                   # PWA manifest - めしログに更新
├── page.tsx                      # / → /home にリダイレクト
├── providers.tsx                 # 既存（Jotai + TanStack Query）
│
├── (auth)/                       # 認証ページ（ボトムナビなし）
│   ├── layout.tsx                # 中央寄せレイアウト
│   ├── login/page.tsx
│   └── signup/page.tsx
│
├── (main)/                       # 認証済みページ（ボトムナビあり）
│   ├── layout.tsx                # 認証ガード + BottomNavigation
│   ├── home/page.tsx             # S-01 デイリービュー
│   ├── plan/page.tsx             # S-07 献立カレンダー
│   ├── recipes/
│   │   ├── page.tsx              # S-04 レシピ一覧
│   │   └── [id]/page.tsx         # S-05 レシピ登録/編集 (id="new"で新規)
│   └── other/
│       ├── page.tsx              # その他タブメニュー
│       ├── set-menus/
│       │   ├── page.tsx          # S-06 セットメニュー一覧
│       │   └── [id]/page.tsx     # S-06a セットメニュー登録/編集
│       ├── food-masters/
│       │   ├── page.tsx          # S-08 食品マスタ一覧
│       │   └── [id]/page.tsx     # S-08a 食品マスタ登録/編集
│       ├── report/page.tsx       # S-09 ウィークリーレポート
│       └── settings/page.tsx     # S-10 設定
│
└── auth/callback/route.ts        # Supabase Auth コールバック
```

**設計判断:**
- `(auth)` / `(main)` のRoute Groupでレイアウトを分離
- S-02（食事登録）, S-02a（アイテム編集）, S-03（OCR）はモーダル/オーバーレイ（ルート不要）
- `[id]`ルートで `id="new"` を新規作成として扱う

---

## 2. ディレクトリ構成

各機能の hooks / types / stores / utils を `features/{feature}/` 配下に集約し、
`src/` 直下には共通・横断的なものだけを置く。

```
src/
├── app/                              # ルート構成（上記参照）
│
├── components/
│   ├── features/
│   │   │
│   │   ├── auth/                     # ── 認証 ──
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx
│   │   │   │   └── signup-form.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-auth.ts           # signIn, signUp, signOut, user
│   │   │   └── index.ts
│   │   │
│   │   ├── meals/                    # ── 食事記録（S-01, S-02, S-02a） ──
│   │   │   ├── components/
│   │   │   │   ├── daily-view.tsx
│   │   │   │   ├── date-navigator.tsx
│   │   │   │   ├── daily-summary-card.tsx
│   │   │   │   ├── plan-transfer-banner.tsx
│   │   │   │   ├── meal-slot-list.tsx
│   │   │   │   ├── meal-slot-card.tsx
│   │   │   │   ├── meal-item-row.tsx
│   │   │   │   ├── meal-register-drawer.tsx
│   │   │   │   ├── source-selector.tsx
│   │   │   │   ├── manual-input-form.tsx
│   │   │   │   ├── recipe-selector.tsx
│   │   │   │   ├── food-master-selector.tsx
│   │   │   │   ├── set-menu-selector.tsx
│   │   │   │   ├── meal-register-card.tsx
│   │   │   │   └── meal-item-edit-modal.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-daily-meals.ts        # 日次食事取得
│   │   │   │   ├── use-daily-summary.ts      # 日次サマリーRPC
│   │   │   │   ├── use-register-meal-items.ts # 食事一括登録RPC
│   │   │   │   ├── use-update-meal-item.ts   # 食事アイテム更新
│   │   │   │   └── use-delete-meal-item.ts   # 食事アイテム削除
│   │   │   ├── stores/
│   │   │   │   ├── date-atom.ts              # selectedDate（YYYY-MM-DD）
│   │   │   │   └── meal-register-atom.ts     # ドロワー開閉、対象meal_type、カード一覧
│   │   │   ├── types/
│   │   │   │   └── meal.ts                   # Meal, MealItem（cost含む）, MealItemCost + Zodスキーマ
│   │   │   ├── utils/
│   │   │   │   └── nutrition-calc.ts         # カロリー・PFC合計計算
│   │   │   └── index.ts
│   │   │
│   │   ├── ocr/                      # ── OCR読み取り（S-03） ──
│   │   │   ├── components/
│   │   │   │   ├── ocr-camera-overlay.tsx
│   │   │   │   └── ocr-result-form.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-ocr.ts                # Tesseract.js統合
│   │   │   ├── stores/
│   │   │   │   └── ocr-atom.ts               # カメラ開閉、解析結果
│   │   │   ├── utils/
│   │   │   │   └── ocr-parser.ts             # 正規表現ベース栄養素パーサー
│   │   │   └── index.ts
│   │   │
│   │   ├── recipes/                  # ── レシピ（S-04, S-05） ──
│   │   │   ├── components/
│   │   │   │   ├── recipe-list-view.tsx
│   │   │   │   ├── recipe-card.tsx
│   │   │   │   ├── recipe-form-view.tsx
│   │   │   │   ├── recipe-form.tsx
│   │   │   │   ├── ingredient-list.tsx
│   │   │   │   ├── ingredient-row.tsx
│   │   │   │   └── pfc-balance-bar.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-recipes.ts            # レシピ一覧
│   │   │   │   ├── use-recipe-detail.ts      # レシピ詳細
│   │   │   │   ├── use-save-recipe.ts        # レシピ保存
│   │   │   │   └── use-delete-recipe.ts      # レシピ論理削除
│   │   │   ├── types/
│   │   │   │   └── recipe.ts                 # Recipe, RecipeIngredient + Zodスキーマ
│   │   │   ├── utils/
│   │   │   │   └── recipe-calc.ts            # 1人分算出ユーティリティ
│   │   │   └── index.ts
│   │   │
│   │   ├── set-menus/                # ── セットメニュー（S-06, S-06a） ──
│   │   │   ├── components/
│   │   │   │   ├── set-menu-list-view.tsx
│   │   │   │   ├── set-menu-card.tsx
│   │   │   │   └── set-menu-form-view.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-set-menus.ts          # セットメニュー一覧
│   │   │   │   ├── use-save-set-menu.ts      # セットメニュー保存
│   │   │   │   └── use-register-set-menu.ts  # セットメニュー→食事登録RPC
│   │   │   ├── types/
│   │   │   │   └── set-menu.ts               # SetMenu, SetMenuItem + Zodスキーマ
│   │   │   └── index.ts
│   │   │
│   │   ├── plan/                     # ── 献立カレンダー（S-07） ──
│   │   │   ├── components/
│   │   │   │   ├── plan-calendar-view.tsx
│   │   │   │   ├── plan-calendar-grid.tsx
│   │   │   │   ├── plan-cell.tsx
│   │   │   │   ├── plan-menu-select-modal.tsx
│   │   │   │   └── plan-weekly-summary.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-meal-plans.ts         # 献立取得
│   │   │   │   ├── use-save-meal-plan.ts     # 献立保存
│   │   │   │   └── use-transfer-plan.ts      # 献立→食事転記RPC
│   │   │   ├── stores/
│   │   │   │   └── plan-week-atom.ts         # 選択週
│   │   │   ├── types/
│   │   │   │   └── meal-plan.ts              # MealPlan + Zodスキーマ
│   │   │   └── index.ts
│   │   │
│   │   ├── food-masters/             # ── 食品マスタ（S-08, S-08a） ──
│   │   │   ├── components/
│   │   │   │   ├── food-master-list-view.tsx
│   │   │   │   ├── food-master-card.tsx
│   │   │   │   └── food-master-form-view.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-food-masters.ts       # 食品マスタ一覧
│   │   │   │   ├── use-save-food-master.ts   # 食品マスタ保存
│   │   │   │   └── use-delete-food-master.ts # 食品マスタ論理削除
│   │   │   ├── types/
│   │   │   │   └── food-master.ts            # FoodMaster + Zodスキーマ
│   │   │   └── index.ts
│   │   │
│   │   ├── report/                   # ── ウィークリーレポート（S-09） ──
│   │   │   ├── components/
│   │   │   │   ├── weekly-report-view.tsx
│   │   │   │   ├── weekly-calorie-chart.tsx
│   │   │   │   ├── weekly-pfc-chart.tsx
│   │   │   │   └── weekly-cost-chart.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-weekly-report.ts      # 週次レポートRPC
│   │   │   ├── stores/
│   │   │   │   └── report-week-atom.ts       # 選択週
│   │   │   └── index.ts
│   │   │
│   │   ├── settings/                 # ── 設定（S-10） ──
│   │   │   ├── components/
│   │   │   │   ├── settings-menu.tsx
│   │   │   │   ├── csv-export-section.tsx
│   │   │   │   └── danger-zone-section.tsx
│   │   │   ├── utils/
│   │   │   │   └── csv-export.ts             # CSVエクスポート生成
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/                   # ── 共通レイアウト ──
│   │   │   ├── bottom-navigation.tsx
│   │   │   ├── header.tsx
│   │   │   ├── page-container.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── pwa/                      # 既存（ServiceWorkerRegister）
│   │
│   └── ui/                           # shadcn/ui + カスタム共通UI
│       ├── button/                   # 既存
│       ├── card/                     # 既存
│       ├── input/                    # 既存
│       ├── label/                    # 既存
│       ├── empty-state/              # アイコン + メッセージ + CTAボタン
│       ├── number-stepper/           # ±0.5刻みステッパー（人数調整用）
│       ├── search-input/             # 検索アイコン付きデバウンスInput
│       ├── pfc-bar/                  # P/F/Cカラーバー
│       └── confirm-dialog/           # 汎用削除確認ダイアログ
│
├── hooks/                            # 共通hooks（機能横断）
│   ├── query-keys.ts                 # TanStack Query キーファクトリ
│   ├── use-supabase.ts               # ブラウザ用Supabaseクライアント
│   └── index.ts
│
├── lib/supabase/                     # 既存（client.ts, server.ts, middleware.ts）
│
├── types/                            # 共通型（機能横断）
│   ├── database.ts                   # Supabase自動生成型
│   ├── common.ts                     # MealType, SourceType, NutritionValues等
│   └── index.ts
│
├── utils/                            # 共通ユーティリティ
│   ├── cn.ts                         # 既存
│   └── index.ts
│
└── __tests__/                        # テストファイル
```

**設計判断:**
- 各機能の hooks / types / stores / utils をその機能ディレクトリに集約（コロケーション）
- `src/hooks/`, `src/types/`, `src/utils/` には機能横断の共通コードのみ配置
- 機能間で型を参照する場合は `@/components/features/{feature}/types` から直接 import
- barrel export（`index.ts`）で各機能の公開APIを制御

---

## 3. コンポーネント設計

### S-01 ホーム（デイリービュー）

```
(main)/home/page.tsx [Server]
└── DailyView [Client]
    ├── DateNavigator [Client] ← selectedDate atom
    ├── DailySummaryCard [Client] ← useDailySummary
    ├── PlanTransferBanner [Client] ← useUntransferredPlans（条件表示）
    └── MealSlotList [Client]
        └── MealSlotCard [Client] ×4 ← useDailyMeals
            ├── MealItemRow [Client] → タップでMealItemEditModal
            ├── 「登録する」/「+ 追加する」Button
            ├── MealRegisterDrawer [Client] ← Sheet
            │   ├── SourceSelector [Client] ← Tabs
            │   ├── ManualInputForm / RecipeSelector / FoodMasterSelector / SetMenuSelector
            │   ├── MealRegisterCard [Client] ×N
            │   └── 「○件まとめて登録する」Button
            └── MealItemEditModal [Client] ← Dialog
```

### S-07 献立カレンダー

```
(main)/plan/page.tsx [Server]
└── PlanCalendarView [Client]
    ├── 週ナビゲーション矢印 ← planWeekStart atom
    ├── PlanCalendarGrid [Client] ← ScrollArea横スクロール
    │   └── PlanCell [Client] ×21（7日×3食）
    │       └── PlanMenuSelectModal [Client]
    └── PlanWeeklySummary [Client]
```

### S-04/S-05 レシピ

```
(main)/recipes/page.tsx [Server]
└── RecipeListView [Client]
    ├── SearchInput [Client] ← sticky
    └── RecipeCard [Client] ×N

(main)/recipes/[id]/page.tsx [Server]
└── RecipeFormView [Client]
    ├── RecipeForm [Client] ← React Hook Form + Zod
    ├── IngredientList [Client]
    │   └── IngredientRow [Client] ×N（動的追加/スワイプ削除）
    └── PfcBalanceBar [Client] ← リアルタイム更新
```

---

## 4. 状態管理設計

### TanStack Query キーファクトリ

```typescript
// src/hooks/query-keys.ts
export const queryKeys = {
  meals: {
    all: ["meals"] as const,
    daily: (date: string) => ["meals", "daily", date] as const,
    summary: (date: string) => ["meals", "summary", date] as const,
  },
  recipes: {
    all: ["recipes"] as const,
    list: (search?: string) => ["recipes", "list", search] as const,
    detail: (id: string) => ["recipes", "detail", id] as const,
  },
  foodMasters: {
    all: ["food-masters"] as const,
    list: (search?: string) => ["food-masters", "list", search] as const,
    detail: (id: string) => ["food-masters", "detail", id] as const,
  },
  setMenus: {
    all: ["set-menus"] as const,
    list: () => ["set-menus", "list"] as const,
    detail: (id: string) => ["set-menus", "detail", id] as const,
  },
  plans: {
    all: ["plans"] as const,
    weekly: (weekStart: string) => ["plans", "weekly", weekStart] as const,
    untransferred: (date: string) => ["plans", "untransferred", date] as const,
  },
  report: {
    weekly: (weekStart: string) => ["report", "weekly", weekStart] as const,
  },
} as const;
```

### キャッシュ無効化戦略

各Mutation hookの`onSuccess`で関連クエリを無効化:
- `useRegisterMealItems` → `meals.daily(date)` + `meals.summary(date)` を無効化
- `useUpdateMealItem` / `useDeleteMealItem` → 同上
- `useSaveRecipe` → `recipes.all` を無効化
- `useTransferPlan` → `meals.daily(date)` + `plans.untransferred(date)` を無効化

---

## 5. バックエンド設計

### 認証フロー

```
middleware.ts（プロジェクトルート）
├── updateSession(request) ← 既存のsrc/lib/supabase/middleware.ts
├── supabase.auth.getUser()
├── 未認証 + /(main)/* → /login にリダイレクト
├── 認証済み + /(auth)/* → /home にリダイレクト
└── /auth/callback, 静的アセット → パススルー

src/app/auth/callback/route.ts
├── code パラメータ取得
├── supabase.auth.exchangeCodeForSession(code)
└── /home にリダイレクト
```

### テーブル・RLS

docs/03-db-design.md に定義済みの9テーブルを Supabase MCP でマイグレーション。
全ユーザーテーブルに `auth.uid() = user_id` の RLS ポリシーを適用。

**列挙値:** meal_type / source_type / category は DB 上 TEXT 型、TypeScript 側で union type として型安全を担保（定義は 03-db-design.md 参照）。

**タイムゾーン:** DATE 型はクライアントのローカル日付をそのまま保存。TIMESTAMPTZ は内部 UTC。「当日」判定はクライアント側で算出（詳細は 03-db-design.md 参照）。

### RPC関数

docs/04-api-tech-stack.md に SQL 定義を含む5つのRPC:
- `register_meal_items` — カードの複数アイテム一括登録（トランザクション保証）
- `register_set_menu_to_meal` — セットメニューの全アイテムを食事記録に一括登録
- `transfer_plan_to_meal` — 献立→食事記録転記 + is_transferred フラグ更新
- `get_daily_summary` — 日次集計（meal_type 別の合計カロリー・PFC・食費）
- `get_weekly_summary` — 週次集計（日別推移データ、generate_series で欠損日を補完）

---

## 6. PWA設計

### マニフェスト更新
- name: "めしログ", short_name: "めしログ"
- theme_color: #FFFFFF, background_color: #FFFFFF
- display: standalone

### Service Worker キャッシュ戦略
- **App Shell**: Cache First（HTML, CSS, JS）
- **API**: Network First with fallback（Supabase REST）
- **画像**: Cache First with expiration

### オフライン対応
- キャッシュ済みデータの閲覧のみ（Phase 5で実装）
- オフラインバナー表示

---

## 7. 追加 shadcn/ui コンポーネント

| コンポーネント | 用途 | Phase |
|---|---|---|
| sheet | 食事登録ドロワー (S-02) | 1 |
| dialog | 削除確認、メニュー選択 | 1 |
| sonner | トースト通知 | 1 |
| skeleton | ローディング状態 | 1 |
| select | カテゴリ選択、食事タイプ選択 | 1 |
| tabs | ソース切り替え（手動/レシピ/マスタ/セット） | 1 |
| badge | 登録元バッジ、削除済みバッジ | 1 |
| textarea | レシピメモ、食品マスタメモ | 2 |
| separator | フォーム区切り | 2 |
| dropdown-menu | 長押しコンテキスト | 3 |
| scroll-area | 献立カレンダー横スクロール | 4 |
| alert-dialog | 全データ削除二段階確認 | 5 |

---

## 8. 実装順序

### Phase 1: MVP（食事記録CRUD + デイリーサマリー）

**Step 1a: 基盤**
- `middleware.ts` — 認証リダイレクト
- `src/types/database.ts`, `common.ts`, `index.ts` — 共通型
- `src/hooks/query-keys.ts`, `use-supabase.ts`, `index.ts` — 共通hooks
- Supabase: meals + meal_items + meal_item_costs テーブル + RLS

**Step 1b: 認証**
- `src/app/(auth)/layout.tsx`, `login/page.tsx`, `signup/page.tsx`
- `src/components/features/auth/components/login-form.tsx`, `signup-form.tsx`
- `src/components/features/auth/hooks/use-auth.ts`
- `src/components/features/auth/index.ts`
- `src/app/auth/callback/route.ts`

**Step 1c: レイアウト + shadcn追加**
- `src/app/(main)/layout.tsx`
- `src/components/features/layout/bottom-navigation.tsx`, `header.tsx`, `page-container.tsx`, `index.ts`
- shadcn install: sheet, dialog, sonner, skeleton, badge, tabs, select

**Step 1d: ホーム画面 + 食事記録**
- `src/app/(main)/home/page.tsx`
- `src/components/features/meals/hooks/` — use-daily-meals, use-daily-summary, use-register-meal-items, use-update-meal-item, use-delete-meal-item
- `src/components/features/meals/stores/` — date-atom, meal-register-atom
- `src/components/features/meals/types/meal.ts`
- `src/components/features/meals/utils/nutrition-calc.ts`
- `src/components/features/meals/components/` — daily-view, date-navigator, daily-summary-card, meal-slot-card, meal-register-drawer, manual-input-form, meal-item-edit-modal 等
- `src/components/ui/` カスタムUI（empty-state, number-stepper, pfc-bar, confirm-dialog）
- Supabase RPC: `register_meal_items`, `get_daily_summary`

### Phase 2: OCR + 食品マスタ
### Phase 3: レシピ + セットメニュー
### Phase 4: 献立カレンダー + ウィークリーレポート
### Phase 5: PWA強化 + 設定 + CSVエクスポート

---

## 検証方法

1. `pnpm dev` で開発サーバー起動
2. `/login` → サインアップ → `/home` リダイレクト確認
3. 食事登録ドロワーから手動入力 → カード追加 → 一括登録 → デイリーサマリー更新確認
4. アイテムタップ → 編集モーダル → 更新/削除 → サマリー再計算確認
5. `pnpm test:run` で全テスト通過
6. `pnpm lint` でBiomeチェック通過
7. `pnpm build` でプロダクションビルド成功
