-- Import tokens: only the hash is stored, authenticated cannot read the hash, each user sees and revokes only
-- their own tokens, a revoked token cannot be turned back on, rows are not deleted, and a user holds at most
-- 5 tokens that are not revoked
begin;
select plan(52);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000e1', 'token-a@example.com'),
  ('00000000-0000-4000-8000-0000000000e2', 'token-b@example.com');

-- B's token, written as the table owner (bypassing RLS)
insert into import_tokens (id, user_id, label, token_hash, token_prefix) values
  ('00000000-0000-4000-8000-0000000000f2', '00000000-0000-4000-8000-0000000000e2', 'B',
   encode(sha256(convert_to('token-b1', 'UTF8')), 'hex'), 'mlg_bbbb');

-- Structure
select ok(
  (select relrowsecurity from pg_class where oid = 'public.import_tokens'::regclass),
  'import_tokens has RLS enabled'
);
select ok(
  not has_table_privilege('anon', 'public.import_tokens',
    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'),
  'anon has no privilege on import_tokens'
);
select ok(
  not has_column_privilege('authenticated', 'public.import_tokens', 'token_hash', 'SELECT'),
  'authenticated cannot select token_hash'
);
select ok(
  has_column_privilege('authenticated', 'public.import_tokens', 'id', 'SELECT')
    and has_column_privilege('authenticated', 'public.import_tokens', 'user_id', 'SELECT')
    and has_column_privilege('authenticated', 'public.import_tokens', 'label', 'SELECT')
    and has_column_privilege('authenticated', 'public.import_tokens', 'token_prefix', 'SELECT')
    and has_column_privilege('authenticated', 'public.import_tokens', 'scopes', 'SELECT')
    and has_column_privilege('authenticated', 'public.import_tokens', 'created_at', 'SELECT')
    and has_column_privilege('authenticated', 'public.import_tokens', 'last_used_at', 'SELECT')
    and has_column_privilege('authenticated', 'public.import_tokens', 'revoked_at', 'SELECT'),
  'authenticated can select every other column'
);
select ok(
  has_table_privilege('authenticated', 'public.import_tokens', 'INSERT'),
  'authenticated can insert'
);
select ok(
  has_column_privilege('authenticated', 'public.import_tokens', 'revoked_at', 'UPDATE'),
  'authenticated can update revoked_at'
);
select ok(
  not has_column_privilege('authenticated', 'public.import_tokens', 'id', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.import_tokens', 'user_id', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.import_tokens', 'label', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.import_tokens', 'token_hash', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.import_tokens', 'token_prefix', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.import_tokens', 'scopes', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.import_tokens', 'created_at', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.import_tokens', 'last_used_at', 'UPDATE'),
  'authenticated cannot update any other column'
);
select ok(
  not has_table_privilege('authenticated', 'public.import_tokens', 'DELETE, TRUNCATE, REFERENCES, TRIGGER'),
  'authenticated cannot delete or truncate'
);
select is(
  (select count(*) from pg_policies
   where schemaname = 'public' and tablename = 'import_tokens' and cmd in ('DELETE', 'ALL')),
  0::bigint,
  'import_tokens has no delete policy'
);
select col_is_unique('public', 'import_tokens', array['token_hash'], 'token_hash is unique');
select has_trigger(
  'public', 'import_tokens', 'check_import_token_limit',
  'import_tokens has the limit trigger'
);
select ok(
  not has_function_privilege('anon', 'public.check_import_token_limit()', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.check_import_token_limit()', 'EXECUTE'),
  'the limit trigger function cannot be called through the API'
);

-- The hash the app computes (Node's SHA-256 in hex) is what Postgres computes for the same token
select is(
  encode(sha256(convert_to('mlg_' || repeat('A', 43), 'UTF8')), 'hex'),
  '6301b8e387893969d6ee7bd7ab059ca1bef72c446b14975acd8f717b84a5ee3d',
  'sha256 in hex matches the app''s hash of the same token'
);

-- Constraints (as the owner)
select throws_ok(
  $$ insert into import_tokens (user_id, label, token_hash, token_prefix)
     values ('00000000-0000-4000-8000-0000000000e1', 'A', 'mlg_' || repeat('A', 43), 'mlg_AAAA') $$,
  '23514', null, 'a plain token cannot be saved as token_hash'
);
select throws_ok(
  $$ insert into import_tokens (user_id, label, token_hash, token_prefix)
     values ('00000000-0000-4000-8000-0000000000e1', 'A', upper(encode(sha256(convert_to('x', 'UTF8')), 'hex')), 'mlg_AAAA') $$,
  '23514', null, 'token_hash must be lowercase hex'
);
select throws_ok(
  $$ insert into import_tokens (user_id, label, token_hash, token_prefix)
     values ('00000000-0000-4000-8000-0000000000e1', 'A', encode(sha256(convert_to('x', 'UTF8')), 'hex'), 'mlg_' || repeat('A', 43)) $$,
  '23514', null, 'a plain token cannot be saved as token_prefix'
);
select throws_ok(
  $$ insert into import_tokens (user_id, label, token_hash, token_prefix)
     values ('00000000-0000-4000-8000-0000000000e1', 'A', encode(sha256(convert_to('x', 'UTF8')), 'hex'), 'abc_AAAA') $$,
  '23514', null, 'token_prefix must start with mlg_'
);
select throws_ok(
  $$ insert into import_tokens (user_id, label, token_hash, token_prefix)
     values ('00000000-0000-4000-8000-0000000000e1', '', encode(sha256(convert_to('x', 'UTF8')), 'hex'), 'mlg_AAAA') $$,
  '23514', null, 'an empty label is refused'
);
select throws_ok(
  $$ insert into import_tokens (user_id, label, token_hash, token_prefix)
     values ('00000000-0000-4000-8000-0000000000e1', repeat('あ', 41), encode(sha256(convert_to('x', 'UTF8')), 'hex'), 'mlg_AAAA') $$,
  '23514', null, 'a label over 40 characters is refused'
);
select throws_ok(
  $$ insert into import_tokens (user_id, label, token_hash, token_prefix)
     values ('00000000-0000-4000-8000-0000000000e1', 'A', encode(sha256(convert_to('token-b1', 'UTF8')), 'hex'), 'mlg_AAAA') $$,
  '23505', null, 'the same hash cannot be saved twice'
);

-- As user A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e1","role":"authenticated"}', true);

select lives_ok(
  $$ insert into import_tokens (id, label, token_hash, token_prefix)
     values ('00000000-0000-4000-8000-0000000000f1', repeat('あ', 40), encode(sha256(convert_to('token-a1', 'UTF8')), 'hex'), 'mlg_aaaa') $$,
  'A can add a token with a 40-character label, without passing user_id'
);
select is(
  (select user_id from import_tokens where id = '00000000-0000-4000-8000-0000000000f1'),
  '00000000-0000-4000-8000-0000000000e1'::uuid,
  'the token belongs to A'
);
select is(
  (select scopes from import_tokens where id = '00000000-0000-4000-8000-0000000000f1'),
  array['health:write']::text[],
  'scopes default to health:write'
);
select ok(
  (select revoked_at is null and last_used_at is null from import_tokens where id = '00000000-0000-4000-8000-0000000000f1'),
  'a new token is not revoked and not used yet'
);
select throws_ok(
  $$ select token_hash from import_tokens $$,
  '42501', null, 'A cannot read token_hash'
);
select throws_ok(
  $$ select * from import_tokens $$,
  '42501', null, 'A cannot select every column either (it includes token_hash)'
);
select is(
  (select count(*) from import_tokens where user_id = '00000000-0000-4000-8000-0000000000e2'),
  0::bigint,
  'A sees none of B''s tokens'
);
select is(
  (select count(*) from import_tokens),
  1::bigint,
  'A sees only their own token'
);
select throws_ok(
  $$ insert into import_tokens (user_id, label, token_hash, token_prefix)
     values ('00000000-0000-4000-8000-0000000000e2', 'A as B', encode(sha256(convert_to('token-a-as-b', 'UTF8')), 'hex'), 'mlg_abab') $$,
  '42501', null, 'A cannot add a token for B'
);
select throws_ok(
  $$ update import_tokens set label = 'renamed' where id = '00000000-0000-4000-8000-0000000000f1' $$,
  '42501', null, 'A cannot change the label'
);
select throws_ok(
  $$ update import_tokens set last_used_at = now() where id = '00000000-0000-4000-8000-0000000000f1' $$,
  '42501', null, 'A cannot change last_used_at'
);
select throws_ok(
  $$ update import_tokens set token_hash = encode(sha256(convert_to('other', 'UTF8')), 'hex') where id = '00000000-0000-4000-8000-0000000000f1' $$,
  '42501', null, 'A cannot change token_hash'
);
select throws_ok(
  $$ delete from import_tokens where id = '00000000-0000-4000-8000-0000000000f1' $$,
  '42501', null, 'A cannot delete a token'
);

-- B's token cannot be revoked by A
update import_tokens set revoked_at = now() where id = '00000000-0000-4000-8000-0000000000f2';

-- The limit of 5 tokens that are not revoked (A has 1 so far)
select lives_ok(
  $$ insert into import_tokens (label, token_hash, token_prefix) values
       ('A2', encode(sha256(convert_to('token-a2', 'UTF8')), 'hex'), 'mlg_aaa2'),
       ('A3', encode(sha256(convert_to('token-a3', 'UTF8')), 'hex'), 'mlg_aaa3'),
       ('A4', encode(sha256(convert_to('token-a4', 'UTF8')), 'hex'), 'mlg_aaa4'),
       ('A5', encode(sha256(convert_to('token-a5', 'UTF8')), 'hex'), 'mlg_aaa5') $$,
  'A can hold 5 tokens'
);
select throws_ok(
  $$ insert into import_tokens (label, token_hash, token_prefix)
     values ('A6', encode(sha256(convert_to('token-a6', 'UTF8')), 'hex'), 'mlg_aaa6') $$,
  'P0001', 'import token limit reached', 'a 6th token that is not revoked is refused'
);
select is(
  (select count(*) from import_tokens where revoked_at is null),
  5::bigint,
  'the refused token was not saved'
);

-- Revoking (the Server Action sets revoked_at)
select lives_ok(
  $$ update import_tokens set revoked_at = '2026-11-20T01:00:00Z'
     where id = '00000000-0000-4000-8000-0000000000f1' and revoked_at is null $$,
  'A can revoke their own token'
);
select is(
  (select revoked_at from import_tokens where id = '00000000-0000-4000-8000-0000000000f1'),
  '2026-11-20T01:00:00Z'::timestamptz,
  'the revoked token has revoked_at'
);
select is(
  (select count(*) from import_tokens where id = '00000000-0000-4000-8000-0000000000f1'),
  1::bigint,
  'the revoked token is kept as a row'
);
update import_tokens set revoked_at = null where id = '00000000-0000-4000-8000-0000000000f1';
select ok(
  (select revoked_at is not null from import_tokens where id = '00000000-0000-4000-8000-0000000000f1'),
  'A cannot turn a revoked token back on'
);
update import_tokens set revoked_at = '2000-01-01T00:00:00Z' where id = '00000000-0000-4000-8000-0000000000f1';
select is(
  (select revoked_at from import_tokens where id = '00000000-0000-4000-8000-0000000000f1'),
  '2026-11-20T01:00:00Z'::timestamptz,
  'A cannot change when a revoked token was revoked'
);
select throws_ok(
  $$ update import_tokens set revoked_at = null where revoked_at is null $$,
  '42501', null, 'setting revoked_at to null on a token that is not revoked is refused'
);
select lives_ok(
  $$ insert into import_tokens (label, token_hash, token_prefix)
     values ('A6', encode(sha256(convert_to('token-a6', 'UTF8')), 'hex'), 'mlg_aaa6') $$,
  'after a revoke, A can add a token again'
);
select throws_ok(
  $$ insert into import_tokens (label, token_hash, token_prefix)
     values ('A7', encode(sha256(convert_to('token-a7', 'UTF8')), 'hex'), 'mlg_aaa7') $$,
  'P0001', 'import token limit reached', 'and is at the limit again'
);
select lives_ok(
  $$ insert into import_tokens (label, token_hash, token_prefix, revoked_at)
     values ('A old', encode(sha256(convert_to('token-a-old', 'UTF8')), 'hex'), 'mlg_aold', now()) $$,
  'a token added already revoked does not count toward the limit'
);

-- As user B: A's tokens do not count toward B's limit
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e2","role":"authenticated"}', true);

select lives_ok(
  $$ insert into import_tokens (label, token_hash, token_prefix)
     values ('B2', encode(sha256(convert_to('token-b2', 'UTF8')), 'hex'), 'mlg_bbb2') $$,
  'B can add a token while A is at the limit'
);
update import_tokens set revoked_at = now() where user_id = '00000000-0000-4000-8000-0000000000e1';

-- As anon
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$ select id from import_tokens $$,
  '42501', null, 'anon cannot read any token'
);
select throws_ok(
  $$ insert into import_tokens (user_id, label, token_hash, token_prefix)
     values ('00000000-0000-4000-8000-0000000000e1', 'anon', encode(sha256(convert_to('token-anon', 'UTF8')), 'hex'), 'mlg_anon') $$,
  '42501', null, 'anon cannot add a token'
);
select throws_ok(
  $$ update import_tokens set revoked_at = now() $$,
  '42501', null, 'anon cannot revoke tokens'
);

-- Back as the owner: what A and B did stayed with their own rows
reset role;

select ok(
  (select revoked_at is null from import_tokens where id = '00000000-0000-4000-8000-0000000000f2'),
  'A could not revoke B''s token'
);
select is(
  (select count(*) from import_tokens
   where user_id = '00000000-0000-4000-8000-0000000000e1' and revoked_at is null),
  5::bigint,
  'B could not revoke A''s tokens, and A holds 5 active tokens'
);
select is(
  (select label from import_tokens where id = '00000000-0000-4000-8000-0000000000f1'),
  repeat('あ', 40),
  'A''s label was not changed'
);

select * from finish();
rollback;
