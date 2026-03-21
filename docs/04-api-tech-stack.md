# API設計・技術スタック

## API設計（Supabase RPC / REST）

### 食事記録

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | /rest/v1/meals?date=eq.YYYY-MM-DD | 指定日の食事一覧を取得 |
| POST | /rest/v1/meals | 食事記録を新規作成 |
| DELETE | /rest/v1/meals?id=eq.{id} | 食事記録を削除 |
| POST | /rest/v1/meal_items | 食事アイテムを追加 |
| PATCH | /rest/v1/meal_items?id=eq.{id} | 食事アイテムを編集 |
| DELETE | /rest/v1/meal_items?id=eq.{id} | 食事アイテムを削除 |
| POST | /rest/v1/meal_item_costs | 食費明細を追加 |
| PATCH | /rest/v1/meal_item_costs?id=eq.{id} | 食費明細を編集 |
| DELETE | /rest/v1/meal_item_costs?id=eq.{id} | 食費明細を削除 |

### レシピ

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | /rest/v1/recipes?deleted_at=is.null | レシピ一覧を取得（論理削除除外） |
| POST | /rest/v1/recipes | レシピを新規作成 |
| PATCH | /rest/v1/recipes?id=eq.{id} | レシピを編集 |
| PATCH | /rest/v1/recipes?id=eq.{id} | レシピを論理削除（deleted_atをセット） |

### 食品マスタ

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | /rest/v1/food_masters?deleted_at=is.null | 食品マスタ一覧を取得 |
| POST | /rest/v1/food_masters | 食品マスタを新規登録 |
| PATCH | /rest/v1/food_masters?id=eq.{id} | 食品マスタを編集 |
| PATCH | /rest/v1/food_masters?id=eq.{id} | 食品マスタを論理削除 |

### セットメニュー

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | /rest/v1/set_menus?select=*,set_menu_items(*)&deleted_at=is.null | セットメニュー一覧（アイテム含む） |
| POST | /rest/v1/set_menus | セットメニューを新規作成 |
| PATCH | /rest/v1/set_menus?id=eq.{id} | セットメニューを編集 |
| PATCH | /rest/v1/set_menus?id=eq.{id} | セットメニューを論理削除 |
| POST | /rest/v1/set_menu_items | セットメニューにアイテムを追加 |
| DELETE | /rest/v1/set_menu_items?id=eq.{id} | セットメニューからアイテムを削除 |

### 献立計画

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | /rest/v1/meal_plans?date=gte.X&date=lte.Y | 期間指定で献立を取得 |
| POST | /rest/v1/meal_plans | 献立を登録 |
| PATCH | /rest/v1/meal_plans?id=eq.{id} | 献立を編集 |
| DELETE | /rest/v1/meal_plans?id=eq.{id} | 献立を削除 |

### RPC（カスタム関数）

| メソッド | パス | 説明 |
| --- | --- | --- |
| RPC | register_meal_items(meal_id, items[]) | カードの複数アイテムを1リクエストで一括登録（トランザクション保証） |
| RPC | register_set_menu_to_meal(set_menu_id, meal_id) | セットメニューの全アイテムを食事記録に一括登録 |
| RPC | transfer_plan_to_meal(target_date, meal_type) | 献立のメニューをmeal_itemsとして一括作成し、is_transferredをtrueに更新 |
| RPC | get_daily_summary(target_date) | 日次集計（合計カロリー・PFC・食費） |
| RPC | get_weekly_summary(start_date) | 週次集計（日別推移データ） |

### RPC関数 SQL定義

#### register_meal_items

食事登録カードから複数アイテムを一括登録する。トランザクションで整合性を保証。

```sql
CREATE OR REPLACE FUNCTION register_meal_items(
  p_meal_id UUID,
  p_items JSONB -- [{ name, calories, protein, fat, carbs, cost, source_type, recipe_id?, food_master_id?, set_menu_id?, serving_quantity?, sort_order }]
)
RETURNS SETOF meal_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item JSONB;
  inserted meal_items;
BEGIN
  -- 権限チェック: meal が呼び出しユーザーのものか確認
  IF NOT EXISTS (
    SELECT 1 FROM meals WHERE id = p_meal_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'meal not found or access denied';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO meal_items (
      meal_id, name, calories, protein, fat, carbs, cost,
      source_type, recipe_id, food_master_id, set_menu_id,
      serving_quantity, sort_order
    ) VALUES (
      p_meal_id,
      item->>'name',
      (item->>'calories')::NUMERIC,
      (item->>'protein')::NUMERIC,
      (item->>'fat')::NUMERIC,
      (item->>'carbs')::NUMERIC,
      (item->>'cost')::NUMERIC,
      item->>'source_type',
      (item->>'recipe_id')::UUID,
      (item->>'food_master_id')::UUID,
      (item->>'set_menu_id')::UUID,
      COALESCE((item->>'serving_quantity')::NUMERIC, 1),
      COALESCE((item->>'sort_order')::INTEGER, 0)
    )
    RETURNING * INTO inserted;

    RETURN NEXT inserted;
  END LOOP;
END;
$$;
```

#### register_set_menu_to_meal

セットメニューの全アイテムを食事記録に一括登録する。

```sql
CREATE OR REPLACE FUNCTION register_set_menu_to_meal(
  p_set_menu_id UUID,
  p_meal_id UUID
)
RETURNS SETOF meal_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec set_menu_items;
  inserted meal_items;
BEGIN
  -- 権限チェック
  IF NOT EXISTS (
    SELECT 1 FROM meals WHERE id = p_meal_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'meal not found or access denied';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM set_menus WHERE id = p_set_menu_id AND user_id = auth.uid() AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'set_menu not found or access denied';
  END IF;

  FOR rec IN
    SELECT * FROM set_menu_items WHERE set_menu_id = p_set_menu_id ORDER BY sort_order
  LOOP
    INSERT INTO meal_items (
      meal_id, name, calories, protein, fat, carbs, cost,
      source_type, recipe_id, food_master_id, set_menu_id,
      serving_quantity, sort_order
    ) VALUES (
      p_meal_id,
      rec.name,
      rec.calories * rec.serving_quantity,
      rec.protein * rec.serving_quantity,
      rec.fat * rec.serving_quantity,
      rec.carbs * rec.serving_quantity,
      rec.cost * rec.serving_quantity,
      'set_menu',
      rec.recipe_id,
      rec.food_master_id,
      p_set_menu_id,
      rec.serving_quantity,
      rec.sort_order
    )
    RETURNING * INTO inserted;

    RETURN NEXT inserted;
  END LOOP;
END;
$$;
```

#### transfer_plan_to_meal

献立のメニューを食事記録に転記し、is_transferred を true に更新する。

```sql
CREATE OR REPLACE FUNCTION transfer_plan_to_meal(
  p_target_date DATE,
  p_meal_type TEXT
)
RETURNS SETOF meal_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_meal_id UUID;
  plan meal_plans;
  inserted meal_items;
BEGIN
  -- 対象日・食事タイプの meal を取得。なければ作成
  SELECT id INTO v_meal_id
  FROM meals
  WHERE user_id = auth.uid() AND date = p_target_date AND meal_type = p_meal_type;

  IF v_meal_id IS NULL THEN
    INSERT INTO meals (user_id, date, meal_type)
    VALUES (auth.uid(), p_target_date, p_meal_type)
    RETURNING id INTO v_meal_id;
  END IF;

  -- 未転記の献立を取得して meal_items に変換
  FOR plan IN
    SELECT * FROM meal_plans
    WHERE user_id = auth.uid()
      AND date = p_target_date
      AND meal_type = p_meal_type
      AND is_transferred = false
  LOOP
    INSERT INTO meal_items (
      meal_id, name, calories, protein, fat, carbs, cost,
      source_type, recipe_id, food_master_id, set_menu_id,
      serving_quantity, sort_order
    ) VALUES (
      v_meal_id,
      plan.planned_name,
      plan.calories,
      plan.protein,
      plan.fat,
      plan.carbs,
      plan.estimated_cost,
      CASE
        WHEN plan.set_menu_id IS NOT NULL THEN 'set_menu'
        WHEN plan.recipe_id IS NOT NULL THEN 'recipe'
        WHEN plan.food_master_id IS NOT NULL THEN 'food_master'
        ELSE 'manual'
      END,
      plan.recipe_id,
      plan.food_master_id,
      plan.set_menu_id,
      1,
      0
    )
    RETURNING * INTO inserted;

    -- 転記済みフラグを更新
    UPDATE meal_plans SET is_transferred = true WHERE id = plan.id;

    RETURN NEXT inserted;
  END LOOP;
END;
$$;
```

#### get_daily_summary

指定日の合計カロリー・PFC・食費を集計して返す。

```sql
CREATE OR REPLACE FUNCTION get_daily_summary(
  p_target_date DATE
)
RETURNS TABLE (
  meal_type TEXT,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_fat NUMERIC,
  total_carbs NUMERIC,
  total_cost NUMERIC,
  item_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.meal_type,
    COALESCE(SUM(mi.calories), 0) AS total_calories,
    COALESCE(SUM(mi.protein), 0)  AS total_protein,
    COALESCE(SUM(mi.fat), 0)      AS total_fat,
    COALESCE(SUM(mi.carbs), 0)    AS total_carbs,
    COALESCE(SUM(mi.cost), 0)     AS total_cost,
    COUNT(mi.id)                   AS item_count
  FROM meals m
  LEFT JOIN meal_items mi ON mi.meal_id = m.id
  WHERE m.user_id = auth.uid() AND m.date = p_target_date
  GROUP BY m.meal_type;
END;
$$;
```

#### get_weekly_summary

指定週（月曜始まり7日間）の日別カロリー・PFC・食費推移を返す。

```sql
CREATE OR REPLACE FUNCTION get_weekly_summary(
  p_start_date DATE -- 週の開始日（月曜日）
)
RETURNS TABLE (
  date DATE,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_fat NUMERIC,
  total_carbs NUMERIC,
  total_cost NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.date,
    COALESCE(SUM(mi.calories), 0) AS total_calories,
    COALESCE(SUM(mi.protein), 0)  AS total_protein,
    COALESCE(SUM(mi.fat), 0)      AS total_fat,
    COALESCE(SUM(mi.carbs), 0)    AS total_carbs,
    COALESCE(SUM(mi.cost), 0)     AS total_cost
  FROM generate_series(p_start_date, p_start_date + 6, '1 day'::INTERVAL) AS d(date)
  LEFT JOIN meals m ON m.date = d.date AND m.user_id = auth.uid()
  LEFT JOIN meal_items mi ON mi.meal_id = m.id
  GROUP BY d.date
  ORDER BY d.date;
END;
$$;
```

---

## 技術スタック詳細

| レイヤー | 技術 | 備考 |
| --- | --- | --- |
| フレームワーク | Next.js 16 (App Router) | React Server Components対応 |
| 言語 | TypeScript | 全ファイルで使用 |
| UIコンポーネント | shadcn/ui | Radix UIベースのコンポーネント |
| スタイリング | Tailwind CSS v4 | ユーティリティファースト |
| クライアント状態 | Jotai | アトムベースの状態管理 |
| サーバー状態 | TanStack Query | データフェッチ・キャッシュ管理 |
| フォーム | React Hook Form + Zod | バリデーション付きフォーム管理 |
| BaaS | Supabase (@supabase/ssr) | 認証・DB・ストレージ・リアルタイム |
| OCR | Tesseract.js | クライアントサイドOCR |
| チャート | Recharts | React用チャートライブラリ |
| PWA | カスタム実装 | Service Worker手動設定（外部ライブラリ不使用） |
| Lint/Format | Biome | ESLint + Prettier の代替 |
| テスト | Vitest + Testing Library | ユニットテスト・コンポーネントテスト |
| パッケージ管理 | pnpm | 高速な依存管理 |
| ホスティング | Vercel | Next.js最適 |

---

## OCR処理フロー

### 処理ステップ

1. カメラ起動（navigator.mediaDevices.getUserMedia）
2. フレームキャプチャ（Canvasに描画）
3. Tesseract.jsで日本語OCR実行（lang: 'jpn'）
4. 抽出テキストを正規表現でパース
5. 結果をフォームにプリセット。手動修正を促す

### パース対象フィールド

- 熱量（エネルギー）→ calories
- たんぱく質 → protein
- 脂質 → fat
- 炭水化物 → carbs
- 商品名（パッケージ上部）→ name

### 注意事項

- 日本語Tesseractの精度は完璧ではないため、必ず手動確認・修正フローを組み込む
- 画像の前処理（グレースケール化・コントラスト調整）で精度向上を図る
- 初回モデルロードが遅いため、Service Workerで事前キャッシュを検討

---

## 非機能要件

| 項目 | 要件 |
| --- | --- |
| レスポンス | 主要画面の初回表示: 2秒以内（3G回線想定） |
| オフライン | PWA Service Workerによる基本画面キャッシュ |
| セキュリティ | Supabase RLSで個人データを保護 |
| データバックアップ | Supabaseの自動バックアップに依存 |
| ブラウザ対応 | Chrome / Safari（iOS）の最新2バージョン |
| アクセシビリティ | 基本的なaria属性の付与、タップターゲット44px以上 |

## PWAマニフェスト仕様

| 項目 | 値 |
| --- | --- |
| name | めしログ |
| short_name | めしログ |
| display | standalone |
| start_url | / |
| theme_color | #FFFFFF |
| background_color | #FFFFFF |
| アイコン | 192x192px, 512x512px の2サイズ（PNG） |

## Supabase Storage 利用方針

OCRで撮影した栄養表画像の保存にSupabase Storageを使用する。

- **バケット名:** meal-images
- **ファイル命名規則:** `{user_id}/{date}/{meal_type}_{timestamp}.jpg`
- **アクセス制御:** RLSにより本人のみアクセス可能
- **保存はオプション**（ユーザーが「画像を保存する」トグルで選択可能）
- **容量制限:** 1画像あたり最大5MB
