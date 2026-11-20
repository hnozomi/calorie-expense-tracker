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
対象: `meals`, `recipes`, `food_masters`, `set_menus`, `meal_plans`, `user_settings`, `ocr_scans`（`ocr_scans` は SELECT と INSERT だけ。数えるための記録なので更新・削除はさせない）, `health_daily_values`（SELECT と DELETE は持ち主。INSERT と UPDATE は持ち主かつ `source = 'manual'` のときだけ。下の例）, `import_tokens`（SELECT と INSERT は持ち主。UPDATE は失効だけ。DELETE は無い。下の例）

```sql
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id)
```

`health_daily_values` の INSERT / UPDATE は、持ち主の条件に出所の条件を足す。画面からは手入力しか書けず、`withings` などの自動の出所を偽れない（自動の出所の行は、取り込み関数 `import_health_daily` だけが書く。§3 の例外）。UPDATE は USING と WITH CHECK の両方に付けるので、自動の行を書き換えることも、手入力の行を自動の出所に変えることもできない。

```sql
-- INSERT
WITH CHECK ((select auth.uid()) = user_id AND source = 'manual')
-- UPDATE
USING ((select auth.uid()) = user_id AND source = 'manual')
WITH CHECK ((select auth.uid()) = user_id AND source = 'manual')
```

`import_tokens` の UPDATE は失効のためだけにある。USING でまだ失効していない行に絞り、WITH CHECK で `revoked_at` が入ることを求めるので、失効したトークンを有効に戻すこと（5件の上限の回り道にもなる）も、失効の時刻を書き換えることもできない。更新できる列は列の権限で `revoked_at` だけにしてある（§3）。DELETE のポリシーは付けない（失効は `revoked_at` で表し、履歴を残す）。

```sql
-- UPDATE
USING ((select auth.uid()) = user_id AND revoked_at IS NULL)
WITH CHECK ((select auth.uid()) = user_id AND revoked_at IS NOT NULL)
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
| `claim_ocr_scan(INTEGER)` | INVOKER | 不許可 | 許可 | OCR の回数を1件記録する。日本時間の今日の回数が上限以上なら記録せず false |
| `import_health_daily(TEXT, JSONB)` | **DEFINER**（例外。下の「例外：理由と守り方」） | **許可** | 許可 | 健康データの取り込み。Cookie を持たない取り込み口（Route Handler）が publishable キーで anon として呼ぶ。PUBLIC からは REVOKE。`SET search_path = ''` |
| `update_updated_at()` | INVOKER（トリガー用） | — | — | `updated_at` 自動更新トリガー。直接呼び出し対象ではない |
| `check_import_token_limit()` | INVOKER（トリガー用） | 不許可 | 不許可 | `import_tokens` の INSERT の前に、有効なトークンが5件あれば断る。DB で数えるのは、ログイン中の利用者は Server Action を通さず API から直接 INSERT もできるため。同時に送られても両方通らないよう、利用者ごとの advisory lock を取る。`SET search_path = ''` |

### テーブルの権限（GRANT）

`public` スキーマの既定の権限（`ALTER DEFAULT PRIVILEGES`）は、新しいテーブルに anon と authenticated の ALL を付ける。そのため新しいテーブルでは、先に REVOKE ALL してから使う分だけ GRANT する。

| テーブル | anon | authenticated | 備考 |
|---|---|---|---|
| `ocr_scans` | なし（REVOKE ALL） | SELECT, INSERT | 数えるための記録。更新・削除はポリシーも無い |
| `health_daily_values` | なし（REVOKE ALL） | SELECT, INSERT, UPDATE, DELETE | 書けるのは `source = 'manual'` の行だけ（§2 のポリシー）。TRUNCATE などは付けない |
| `import_tokens` | なし（REVOKE ALL） | SELECT（`token_hash` 以外の列）, INSERT, UPDATE（`revoked_at` 列だけ） | ハッシュはアプリからも読めない（`select *` も 42501 になるので、列を名指しで読む）。DELETE は付けない |

**原則**:
- 書き込み・更新を行うRPCは認証必須（`anon` から REVOKE）。
- 読み取り専用RPCで、かつVercelのSSGプリレンダーから呼ばれるものだけ、例外的に `anon` にEXECUTEを許可する。
- 全RPCは `SECURITY INVOKER` + `SET search_path = public` を必須にする（`SECURITY DEFINER` は権限昇格のリスクがあるため使わない。RLSを回避する必要がある特別な理由がない限り避ける）。例外は `import_health_daily` の1つだけ（下）。

### 例外：`import_health_daily` が SECURITY DEFINER である理由と守り方

**理由**: 取り込みの送り手（もち）は Supabase のセッションを持たない（ログイン情報を持たせない方針）。共通規約でサービスロールのキーもアプリで使えない。そのため「RLS の下で、ログイン中の利用者として書く」形が作れず、RLS を迂回する場所を1つだけ作り、その中に閉じた。他の案（サービスロールのキー、利用者の JWT を作る、Edge Function）を採らなかった理由はフェーズ1の設計案 ⑤ O-1。

**守り方**:
- 書けるのは「トークンの持ち主の、`health_daily_values` の、自動の出所（`withings` / `apple_health`）の行」だけ。`user_id` はトークンから決まり、引数で渡せない（レコードに知らないキーがあれば断る）。他のテーブルで触るのは、そのトークンの `import_tokens.last_used_at` だけ。手入力（`manual`）の行は一意キーが別なので触れない
- 最初にトークンを照合する。`token_hash`（SHA-256）が一致し、`revoked_at IS NULL` かつ `'health:write' = ANY(scopes)` の行が無ければ、何も書かず `{ ok: false, error: 'unauthorized' }` だけを返す（不明・失効・スコープ不足を分けない。トークンの有無を探られないように）。トークン（256ビットの乱数）が無ければ、publishable キーで誰でも呼べても何も書けない
- レコードは取り込み口の Zod と同じ決まりで関数の中でもう一度確かめる（PostgREST から直接呼ばれても同じ守りになるように）：1〜100件、日付は `YYYY-MM-DD` の実在する日で日本時間の今日まで、出所は自動の2つだけ、項目は4つだけで範囲と桁（体重は小数第2位まで、体脂肪率は第1位まで、歩数は整数、活動量は整数に丸める）、`measured_at` はタイムゾーン付きの ISO 8601、同じ日・出所・項目の重複は不可。1件でも違えば何も書かず `{ ok: false, error: 'invalid_records' }`
- 書き込みは1回の呼び出しで全部か無し（1トランザクション）。同じ利用者の取り込みは advisory lock で1つずつ通す
- `SET search_path = ''` にし、中の名前はすべて `public.` 付きにする（呼び出し側が置いた同名の関数・テーブルに差し替えられないように）
- 返すのは `ok`・`received`・`changed`（または `error`）だけで、トークンの表の中身や他の行は返さない
- 確かめているもの：`supabase/tests/import_health_daily.test.sql`（不明・失効・スコープ不足・空のトークンで1行も書かれない、手入力の行と他人の行が変わらない、ログイン中の別の利用者が呼んでもトークンの持ち主の行になる、不正な1件で全件書かれない、など）

## 4. なぜ一部のRPCだけ anon に EXECUTE を許可しているか

**背景**: `20260707000000_security_hardening.sql` で全RPCから anon の EXECUTE を剥奪したところ、Vercelの本番ビルドが `42501 permission denied for function get_weekly_summary` で失敗した。原因は、`/home` と `/other/report` ページが **Vercelのビルド時（`next build`）に anon キーで静的プリレンダー（SSG）される**ため。`20260707010000_restore_anon_execute_on_summary_rpcs.sql` で `get_daily_summary` / `get_weekly_summary` だけ anon EXECUTE を復元して解決した。

**なぜ安全か**: これらの関数は `SECURITY INVOKER` なので、anon で呼ばれると `auth.uid()` が `NULL` になり、内部の `WHERE user_id = auth.uid()` はすべて `false` に評価される。つまり anon が叩いても常に空の集計結果が返るだけで、他人のデータが漏れることはない。

**チェック方法**: ローカルの `pnpm build`（Turbopack）はこの種のエラーを検知しない。RPCの権限を変更したら、**必ずVercelのデプロイ結果を確認する**こと（`CLAUDE.md` の Deploy Checklist を参照）。

## 5. 新しいRPC・テーブルを追加するときのチェックリスト

- [ ] テーブルに `user_id` があるか。なければRLSで守れないので設計を見直す
- [ ] 子テーブルの場合、親を経由したRLSポリシーをSELECT/INSERT/UPDATE/DELETEの4種とも設定したか（DELETE漏れに注意）
- [ ] RPCは `SECURITY INVOKER` + `SET search_path = public` にしたか（DEFINER にするなら、§3 の例外と同じく理由と守り方を書き、`SET search_path = ''` と `public.` 付きの名前にしたか）
- [ ] RPCが書き込み系なら、`REVOKE EXECUTE ... FROM PUBLIC, anon` しているか
- [ ] RPCが読み取り専用で、かつ `/home` や `/other/report` などプリレンダーされるページから呼ばれるなら、anon EXECUTEを許可し、その理由をこの表に追記したか
- [ ] 新しいテーブルは、既定の権限で付く ALL を `REVOKE ALL ... FROM anon, authenticated` してから、使う操作だけを authenticated に GRANT したか（§3 のテーブルの権限の表に足したか）
- [ ] アプリから書かせない値（`health_daily_values.source` の自動の出所など）を、INSERT の WITH CHECK と UPDATE の USING / WITH CHECK で絞ったか
- [ ] アプリに読ませない・変えさせない列（`import_tokens.token_hash` など）を、列の権限（`GRANT SELECT (...)`・`GRANT UPDATE (...)`）で外したか
- [ ] 秘密の値（取り込みトークンなど）は平文を DB・ログ・URL・Cookie・localStorage に残さず、ハッシュだけを保存しているか
- [ ] pgTAP で「他人の行が0件」「他人の行を更新・削除できない」「anon は読めない」と、絞った値を書けないことを確かめたか
- [ ] マイグレーション適用後、Vercelのデプロイ状況を `mcp__vercel__list_deployments` で確認したか

## 6. 既知のドキュメントの乖離

`docs/04-api-tech-stack.md` に載っているRPCのSQL定義（`register_meal_items` 等）は初期実装時点のもので、`SECURITY DEFINER` のまま記載されている。実際は `20260707000000_security_hardening.sql` で `SECURITY INVOKER` に変更済み。**権限に関する正はマイグレーションファイル（`supabase/migrations/`）であり、`04-api-tech-stack.md` のSQLスニペットは実装当初のイメージとして参考程度に見ること。**
