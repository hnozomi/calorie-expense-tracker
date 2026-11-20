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
user_settings (standalone, per user)
health_daily_values (standalone, per user)
import_tokens (standalone, per user)
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

## user_settings（ユーザー設定）

1日の栄養目標値をユーザーごとに保存する。

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| user_id | UUID (FK, UNIQUE) | auth.users.id への参照（RLS用） |
| target_calories | NUMERIC | 1日の目標カロリー（kcal、デフォルト: 2000） |
| target_protein | NUMERIC | 1日の目標タンパク質（g、デフォルト: 60） |
| target_fat | NUMERIC | 1日の目標脂質（g、デフォルト: 55） |
| target_carbs | NUMERIC | 1日の目標炭水化物（g、デフォルト: 300） |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

---

## health_daily_values（日次の健康データ）

体重・体脂肪率・歩数・活動量を「日付 × 項目 × 出所」で1行に持つ（縦持ち）。行が無い組は欠測。同じ日・同じ項目に複数の出所の行があるとき、どれを表示するかはアプリで決める（DB には持たない）。

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| user_id | UUID (FK) | auth.users.id への参照（RLS用、既定 `auth.uid()`、`ON DELETE CASCADE`） |
| date | DATE | 日本時間の日付 |
| metric | TEXT | 項目（weight_kg / body_fat_pct / steps / active_energy_kcal） |
| source | TEXT | 出所（withings / apple_health / manual） |
| value | NUMERIC | 値。項目ごとの範囲を CHECK（下の表） |
| measured_at | TIMESTAMPTZ (nullable) | 測った時刻（出所が持っていれば） |
| imported_at | TIMESTAMPTZ | 最後に書き込まれた時刻（既定 `now()`。再取り込みでも更新する） |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時（`update_updated_at()` トリガー） |

- 一意制約：`(user_id, date, metric, source)`。取り込みはこのキーで upsert するので、同じ日を送り直しても1行のまま
- 索引：`(user_id, date)`
- 書き込み：アプリ（authenticated）から書けるのは `source = 'manual'` の行だけ。`withings` / `apple_health` の行は取り込み関数 `import_health_daily` だけが書く。権限は `security-model.md` の §2・§3

| metric | 単位 | 範囲（両端を含む） |
| --- | --- | --- |
| weight_kg | kg | 20〜300 |
| body_fat_pct | % | 1〜75 |
| steps | 歩 | 0〜200000 |
| active_energy_kcal | kcal | 0〜10000 |

---

## import_tokens（取り込みトークン）

アプリの外（健康データの取り込み）から、Supabase のセッションを持たずにその利用者として書くためのトークン。平文は持たず、SHA-256 だけを持つ。平文は発行したときに Server Action（`health/api/actions.ts` の `issueImportToken`）の戻り値で1回だけ画面に返す。

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | UUID (PK) | 主キー |
| user_id | UUID (FK) | auth.users.id への参照（RLS用、既定 `auth.uid()`、`ON DELETE CASCADE`） |
| label | TEXT | 用途の名前（1〜40文字） |
| token_hash | TEXT (UNIQUE) | トークンの SHA-256（小文字の16進64文字を CHECK）。authenticated からは読めない |
| token_prefix | TEXT | 画面で見分けるための先頭8文字（`mlg_` と4文字を CHECK）。認証には使わない |
| scopes | TEXT[] | 許す操作（既定 `{health:write}`） |
| created_at | TIMESTAMPTZ | 発行日時 |
| last_used_at | TIMESTAMPTZ (nullable) | 最後に認証が通った時刻（取り込み関数が書く） |
| revoked_at | TIMESTAMPTZ (nullable) | 失効した時刻。NULL なら有効 |

- トークンの形：`mlg_` + 32バイトの乱数の base64url（全体で47文字、256ビット）。乱数なので遅いハッシュは要らない。取り込み関数は `encode(sha256(convert_to(token, 'UTF8')), 'hex')` で照合する
- 有効な（`revoked_at` が NULL の）トークンは1利用者5件まで。`check_import_token_limit()` トリガーが6件目の INSERT を断る（`P0001`、`import token limit reached`）。失効すると、また発行できる
- 失効は `revoked_at` を入れるだけで、行は消さない（履歴を残す）。失効したトークンは有効に戻せない
- 期限は持たない
- 権限は `security-model.md` の §2・§3

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

### metric（健康データの項目）

| 値 | 表示名 |
|---|---|
| weight_kg | 体重（kg） |
| body_fat_pct | 体脂肪率（%） |
| steps | 歩数 |
| active_energy_kcal | 活動量（アクティブエネルギー、kcal） |

### source（健康データの出所）

| 値 | 説明 |
|---|---|
| withings | Withings から取り込み |
| apple_health | Apple Health から取り込み |
| manual | 手入力 |

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

- **DATE型カラム**（meals.date, meal_plans.date, health_daily_values.date）: クライアント側でユーザーのローカルタイムゾーン（想定: JST / Asia/Tokyo）の日付を `YYYY-MM-DD` 形式で送信し、そのまま保存する
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
- **health_daily_values:** SELECT / DELETE は持ち主。INSERT / UPDATE は持ち主かつ `source = 'manual'` のときだけ（アプリから自動の出所を偽れないように）
- **import_tokens:** SELECT / INSERT は持ち主。UPDATE は持ち主のまだ失効していない行を失効させる（`revoked_at` を入れる）ときだけ。DELETE のポリシーは無い
- **子テーブルの保護:** meal_items, meal_item_costs, recipe_ingredients, set_menu_items にも個別のRLSポリシーを設定する。Supabase REST APIは子テーブルへの直接アクセスを許可するため、親テーブルのRLSだけでは不十分
  - `meal_items`: `meal_id` → `meals.user_id` を経由してチェック
  - `meal_item_costs`: `meal_item_id` → `meal_items.meal_id` → `meals.user_id` を経由してチェック
  - `recipe_ingredients`: `recipe_id` → `recipes.user_id` を経由してチェック
  - `set_menu_items`: `set_menu_id` → `set_menus.user_id` を経由してチェック
