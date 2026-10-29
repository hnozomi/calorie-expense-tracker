-- Local only (supabase start / db reset). Never run against production.

-- Accounts AI uses for debugging and E2E. They are the same in every app (apps/.claude/rules/supabase.md)
-- Empty strings, not null, in the token columns: Auth fails to sign in a user whose token columns are null
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('e2e-password', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
from (values
  ('e2e00000-0000-4000-8000-000000000001'::uuid, 'e2e@example.com'),
  ('e2e00000-0000-4000-8000-000000000002'::uuid, 'e2e-previous@example.com'),
  ('e2e00000-0000-4000-8000-000000000003'::uuid, 'e2e-next@example.com')
) as accounts(id, email);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select id, id, id::text, 'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  now(), now(), now()
from auth.users
where email in ('e2e@example.com', 'e2e-previous@example.com', 'e2e-next@example.com');
