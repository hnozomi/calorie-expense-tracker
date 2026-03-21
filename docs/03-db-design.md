# DB設計

## データベース設計（Supabase / PostgreSQL）

### テーブル構成図

```
meals ──┬─ meal_items ───── meal_item_costs
        │      ├── → recipes ───── recipe_ingredients
        │      ├── → food_masters
        │      └── → set_menus ── set_menu_items
        │                            ├── → recipes
        │                            └── → food_masters
        └─ meal_plans
               ├── → recipes
               ├── → food_masters
               └── → set_menus
```

---

## meals（食事記録）

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| user_id | UUID (FK) | auth.users.id への参照（RLS用） |
| date | DATE | 食事日 |
| meal_type | TEXT | 朝食 / 昼食 / 夕食 / 間食 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

---

## meal_items（食事アイテム）

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| meal_id | UUID (FK) | meals.id への参照 |
| name | TEXT | メニュー名 |
| calories | NUMERIC | カロリー（kcal）※1人分あたりの値 |
| protein | NUMERIC | タンパク質（g） |
| fat | NUMERIC | 脂質（g） |
| carbs | NUMERIC | 炭水化物（g） |
| source_type | TEXT | 登録元（manual / ocr / recipe / food_master / set_menu） |
| recipe_id | UUID (FK, nullable) | recipes.id への参照 |
| food_master_id | UUID (FK, nullable) | food_masters.id への参照 |
| set_menu_id | UUID (FK, nullable) | set_menus.id への参照 |
| cost | NUMERIC | 食費（円）。手動入力 or meal_item_costs の合計から算出 |
| serving_quantity | NUMERIC | 何人分食べたか（デフォルト: 1） |
| sort_order | INTEGER | 表示順 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

---

## meal_item_costs（食費明細）

1つのmeal_itemに対して複数の食費明細を持つことができる（オプション）。
手動入力やOCR・食品マスタ経由の登録では meal_items.cost に直接値を入れるだけでよい。
レシピ経由など材料ごとの内訳を記録したい場合に meal_item_costs を使い、subtotal の合計を meal_items.cost に反映する。

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| meal_item_id | UUID (FK) | meal_items.id への参照 |
| item_name | TEXT | 食材・商品名 |
| unit_price | NUMERIC | 単価（円） |
| quantity | NUMERIC | 数量 |
| subtotal | NUMERIC (generated) | 小計（unit_price × quantity、自動計算） |

---

## recipes（レシピ）

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| user_id | UUID (FK) | auth.users.id への参照（RLS用） |
| name | TEXT | レシピ名 |
| servings | INTEGER | 何人分 |
| calories | NUMERIC | 完成品の合計カロリー（kcal） |
| protein | NUMERIC | タンパク質（g） |
| fat | NUMERIC | 脂質（g） |
| carbs | NUMERIC | 炭水化物（g） |
| notes | TEXT (nullable) | メモ |
| deleted_at | TIMESTAMPTZ (nullable) | 論理削除日時 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

---

## recipe_ingredients（レシピ材料）

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| recipe_id | UUID (FK) | recipes.id への参照 |
| ingredient_name | TEXT | 材料名 |
| quantity | NUMERIC | 数量（例：2、200、1） |
| unit | TEXT | 単位（例：個、g、大さじ） |
| unit_price | NUMERIC | 単価（円） |

---

## food_masters（食品マスタ）

よく使う食品・コンビニ商品などをマスタとして保存し、食事登録時に再利用する。

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| user_id | UUID (FK) | auth.users.id への参照（RLS用） |
| name | TEXT | 食品名 |
| brand | TEXT (nullable) | ブランド・店舗名 |
| category | TEXT (nullable) | カテゴリ（弁当/パン/惣菜/菓子/飲料/食材/その他） |
| calories | NUMERIC | カロリー（kcal） |
| protein | NUMERIC | タンパク質（g） |
| fat | NUMERIC | 脂質（g） |
| carbs | NUMERIC | 炭水化物（g） |
| default_price | NUMERIC | デフォルト価格（円） |
| notes | TEXT (nullable) | メモ |
| deleted_at | TIMESTAMPTZ (nullable) | 論理削除日時 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

---

## set_menus（セットメニュー）

よく食べる組み合わせ（レシピ＋主食など）をセットとして保存する。

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| user_id | UUID (FK) | auth.users.id への参照（RLS用） |
| name | TEXT | セットメニュー名 |
| total_calories | NUMERIC | 合計カロリー |
| total_protein | NUMERIC | 合計タンパク質 |
| total_fat | NUMERIC | 合計脂質 |
| total_carbs | NUMERIC | 合計炭水化物 |
| total_cost | NUMERIC | 合計食費 |
| deleted_at | TIMESTAMPTZ (nullable) | 論理削除日時 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

---

## set_menu_items（セットメニューアイテム）

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| set_menu_id | UUID (FK) | set_menus.id への参照 |
| name | TEXT | アイテム名 |
| recipe_id | UUID (FK, nullable) | recipes.id への参照 |
| food_master_id | UUID (FK, nullable) | food_masters.id への参照 |
| calories | NUMERIC | カロリー |
| protein | NUMERIC | タンパク質 |
| fat | NUMERIC | 脂質 |
| carbs | NUMERIC | 炭水化物 |
| cost | NUMERIC | 食費 |
| serving_quantity | NUMERIC | 分量（デフォルト: 1、0.5刻みで調整可能） |
| sort_order | INTEGER | 表示順 |

---

## meal_plans（献立計画）

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| user_id | UUID (FK) | auth.users.id への参照（RLS用） |
| date | DATE | 対象日 |
| meal_type | TEXT | 朝食 / 昼食 / 夕食 / 間食 |
| planned_name | TEXT | 予定メニュー名 |
| recipe_id | UUID (FK, nullable) | recipes.id への参照 |
| food_master_id | UUID (FK, nullable) | food_masters.id への参照 |
| set_menu_id | UUID (FK, nullable) | set_menus.id への参照 |
| calories | NUMERIC | 予定カロリー |
| protein | NUMERIC | 予定タンパク質 |
| fat | NUMERIC | 予定脂質 |
| carbs | NUMERIC | 予定炭水化物 |
| estimated_cost | NUMERIC | 予定食費 |
| is_transferred | BOOLEAN | 食事記録に転記済みか（デフォルト: false） |
| created_at | TIMESTAMPTZ | 作成日時 |

---

## 列挙値定義

アプリ内で使用する TEXT 型カラムの取りうる値を以下に定義する。
DB上は TEXT 型のまま保持し、TypeScript 側で union type として型安全を担保する。

### meal_type（食事タイプ）

| 値 | 表示名 |
|---|---|
| breakfast | 朝食 |
| lunch | 昼食 |
| dinner | 夕食 |
| snack | 間食 |

### source_type（登録元）

| 値 | 説明 |
|---|---|
| manual | 手動入力 |
| ocr | OCR読み取り |
| recipe | レシピから登録 |
| food_master | 食品マスタから登録 |
| set_menu | セットメニューから登録 |

### category（食品マスタのカテゴリ）

| 値 | 表示名 |
|---|---|
| bento | 弁当 |
| bread | パン |
| side_dish | 惣菜 |
| snack | 菓子 |
| drink | 飲料 |
| ingredient | 食材 |
| other | その他 |

---

## タイムゾーン方針

- **DATE型カラム**（meals.date, meal_plans.date）: クライアント側でユーザーのローカルタイムゾーン（想定: JST / Asia/Tokyo）の日付を `YYYY-MM-DD` 形式で送信し、そのまま保存する
- **TIMESTAMPTZ型カラム**（created_at, updated_at, deleted_at）: PostgreSQL の TIMESTAMPTZ は内部的にUTCで保存される。表示時にクライアント側でローカルタイムゾーンに変換する
- **「当日」の判定**: クライアント側でユーザーのローカル日付を算出し、APIリクエストのパラメータとして送信する（サーバー側で `now()` を使わない）
- **RPC関数の日付パラメータ**: すべて DATE 型で受け取り、クライアントから送信されたローカル日付をそのまま使用する

---

## 論理削除方針

レシピや食品マスタを削除する場合、それを参照している過去の食事記録やセットメニューの整合性を保つため、以下の方針を採用する。

- recipes, food_masters, set_menus に `deleted_at TIMESTAMPTZ (nullable)` カラムを追加
- 削除操作時は deleted_at に現在時刻をセットする（物理削除は行わない）
- 一覧画面では `deleted_at IS NULL` のレコードのみ表示
- 過去の食事記録（meal_items）は削除されたレシピ/食品マスタの参照を保持し、記録の整合性を維持
- セットメニュー内のアイテムが参照するレシピ/食品マスタが削除された場合、該当アイテムに「削除済み」バッジを表示

---

## RLS（Row Level Security）ポリシー

Supabase RLSを使用し、各ユーザーが自分のデータのみアクセスできるようにする。

- **対象テーブル:** meals, recipes, food_masters, set_menus, meal_plans
- **ポリシー条件:** `auth.uid() = user_id`
- **適用範囲:** SELECT / INSERT / UPDATE / DELETE のすべて
- **子テーブルの保護:** meal_items, meal_item_costs, recipe_ingredients, set_menu_items にも個別のRLSポリシーを設定する。Supabase REST APIは子テーブルへの直接アクセスを許可するため、親テーブルのRLSだけでは不十分
  - `meal_items`: `meal_id` → `meals.user_id` を経由してチェック
  - `meal_item_costs`: `meal_item_id` → `meal_items.meal_id` → `meals.user_id` を経由してチェック
  - `recipe_ingredients`: `recipe_id` → `recipes.user_id` を経由してチェック
  - `set_menu_items`: `set_menu_id` → `set_menus.user_id` を経由してチェック
