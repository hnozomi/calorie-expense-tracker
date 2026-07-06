# RPC検証SQL

マイグレーションで追加するDB関数の、適用前検証用SQL。**全体がトランザクションで、最後に必ずROLLBACKする**ため、実DBに対して安全に実行できる。

## 実行方法

1. 対象の関数定義がまだ無い場合も、スクリプト冒頭で `CREATE OR REPLACE` するため単体で実行可能
2. `p_test_user_id` の箇所は実在するユーザーIDに置き換える(`SELECT id FROM auth.users LIMIT 1;`)
3. Supabase SQL Editor または MCP の `execute_sql` で実行
4. `ALL ASSERTIONS PASSED` のNOTICEが出れば合格。例外が出たら関数かテストを直す
5. 合格後にマイグレーションとして `apply_migration` する

## 命名規約

対応するマイグレーションファイル名に合わせる:
`verify_<マイグレーション名>.sql`

## 注意

- `SET LOCAL ROLE authenticated` + `set_config('request.jwt.claims', ...)` でRLS込みの挙動を検証している(SECURITY INVOKER関数はこれが無いと `auth.uid()` がNULLになる)
- ROLLBACKを絶対に削らないこと
