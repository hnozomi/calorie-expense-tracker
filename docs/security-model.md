# セキュリティモデル（RLS / RPC権限）

Supabaseの行レベルセキュリティ（RLS）とRPC関数の権限方針をまとめたドキュメント。
`4d84c1d`（セキュリティ強化）→`d7aca1d`（anon EXECUTE復元）という実際の往復が起きた反省を踏まえ、
「なぜこの権限になっているか」を1箇所に集約する。新しいテーブル・RPCを追加するときは必ずここを更新する。

## 1. 認証・マルチテナンシーの前提

- 認証は Supabase Auth（`@supabase/ssr`）。ユーザーは `auth.uid()` で識別される。
- すべてのユーザーデータテーブルは `user_id UUID` カラムを持ち、RLSで「自分の行しか見えない」を強制する。
- クライアントからのDB操作は原則 REST（PostgREST）経由。複数テーブルにまたがる整合性が必要な操作だけRPC（`plpgsql`関数）を使う。

## 2. RLSポリシーのパターン

テーブルは「直接 `user_id` を持つ親テーブル」と「親を経由してオーナーシップを判定する子テーブル」の2種類に分かれる。

### 親テーブル（`user_id` を直接持つ）
対象: `meals`, `recipes`, `food_masters`, `set_menus`, `meal_plans`, `user_settings`

```sql
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id)
```

`auth.uid()` を `(select auth.uid())` で包むのは、行ごとではなくクエリごとに1回評価させるための最適化（initplan化）。新しいポリシーを書くときもこの形を踏襲する。

### 子テーブル（親を経由してオーナーシップを判定）
対象: `meal_items`（→`meals`）, `meal_item_costs`（→`meal_items`→`meals`）, `recipe_ingredients`（→`recipes`）, `set_menu_items`（→`set_menus`）

```sql
USING (EXISTS (
  SELECT 1 FROM <parent_table>
  WHERE <parent_table>.id = <child_table>.<fk_column>
    AND <parent_table>.user_id = (select auth.uid())
))
```

**なぜ子テーブルにも個別のRLSが必要か**: SupabaseのREST APIは子テーブルへの直接アクセス（`GET /rest/v1/meal_items?...`）を許可するため、親テーブルのRLSだけでは保護できない。新しく子テーブルを追加する場合、必ず親を経由したポリシーを4種（SELECT/INSERT/UPDATE/DELETE）とも設定すること。過去に `user_settings` でDELETEポリシーが漏れており、削除操作が黙って0件影響で失敗していた（`20260707000000_security_hardening.sql`で修正）。

## 3. RPC関数の権限マトリクス

| 関数 | SECURITY | anon EXECUTE | authenticated EXECUTE | 備考 |
|---|---|---|---|---|
| `get_daily_summary(DATE)` | INVOKER | **許可** | 許可 | 読み取り専用。Vercel SSGのプリレンダーで叩かれるため anon 許可が必須（§4） |
| `get_weekly_summary(DATE)` | INVOKER | **許可** | 許可 | 同上 |
| `register_meal_items(UUID, JSONB)` | INVOKER | 不許可 | 許可 | 書き込み系。認証必須 |
| `register_set_menu_to_meal(UUID, UUID)` | INVOKER | 不許可 | 許可 | 同上 |
| `transfer_meal_to_plan(DATE, TEXT)` | INVOKER | 不許可 | 許可 | 同上 |
| `transfer_plan_to_meal(DATE, TEXT)` | INVOKER | 不許可 | 許可 | 同上 |
| `save_recipe_with_ingredients(...)` | INVOKER | 不許可 | 許可 | 同上（トランザクション保証のためRPC化） |
| `save_set_menu_with_items(...)` | INVOKER | 不許可 | 許可 | 同上 |
| `sync_meals_to_plans(DATE, DATE)` | INVOKER | 不許可 | 許可 | 同上 |
| `update_updated_at()` | INVOKER（トリガー用） | — | — | `updated_at` 自動更新トリガー。直接呼び出し対象ではない |

**原則**:
- 書き込み・更新を行うRPCは認証必須（`anon` から REVOKE）。
- 読み取り専用RPCで、かつVercelのSSGプリレンダーから呼ばれるものだけ、例外的に `anon` にEXECUTEを許可する。
- 全RPCは `SECURITY INVOKER` + `SET search_path = public` を必須にする（`SECURITY DEFINER` は権限昇格のリスクがあるため使わない。RLSを回避する必要がある特別な理由がない限り避ける）。

## 4. なぜ一部のRPCだけ anon に EXECUTE を許可しているか

**背景**: `20260707000000_security_hardening.sql` で全RPCから anon の EXECUTE を剥奪したところ、Vercelの本番ビルドが `42501 permission denied for function get_weekly_summary` で失敗した。原因は、`/home` と `/other/report` ページが **Vercelのビルド時（`next build`）に anon キーで静的プリレンダー（SSG）される**ため。`20260707010000_restore_anon_execute_on_summary_rpcs.sql` で `get_daily_summary` / `get_weekly_summary` だけ anon EXECUTE を復元して解決した。

**なぜ安全か**: これらの関数は `SECURITY INVOKER` なので、anon で呼ばれると `auth.uid()` が `NULL` になり、内部の `WHERE user_id = auth.uid()` はすべて `false` に評価される。つまり anon が叩いても常に空の集計結果が返るだけで、他人のデータが漏れることはない。

**チェック方法**: ローカルの `pnpm build`（Turbopack）はこの種のエラーを検知しない。RPCの権限を変更したら、**必ずVercelのデプロイ結果を確認する**こと（`CLAUDE.md` の Deploy Checklist を参照）。

## 5. 新しいRPC・テーブルを追加するときのチェックリスト

- [ ] テーブルに `user_id` があるか。なければRLSで守れないので設計を見直す
- [ ] 子テーブルの場合、親を経由したRLSポリシーをSELECT/INSERT/UPDATE/DELETEの4種とも設定したか（DELETE漏れに注意）
- [ ] RPCは `SECURITY INVOKER` + `SET search_path = public` にしたか
- [ ] RPCが書き込み系なら、`REVOKE EXECUTE ... FROM PUBLIC, anon` しているか
- [ ] RPCが読み取り専用で、かつ `/home` や `/other/report` などプリレンダーされるページから呼ばれるなら、anon EXECUTEを許可し、その理由をこの表に追記したか
- [ ] マイグレーション適用後、Vercelのデプロイ状況を `mcp__vercel__list_deployments` で確認したか

## 6. 既知のドキュメントの乖離

`docs/04-api-tech-stack.md` に載っているRPCのSQL定義（`register_meal_items` 等）は初期実装時点のもので、`SECURITY DEFINER` のまま記載されている。実際は `20260707000000_security_hardening.sql` で `SECURITY INVOKER` に変更済み。**権限に関する正はマイグレーションファイル（`supabase/migrations/`）であり、`04-api-tech-stack.md` のSQLスニペットは実装当初のイメージとして参考程度に見ること。**
