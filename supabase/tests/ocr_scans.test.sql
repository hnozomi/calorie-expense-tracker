-- OCR scan counting: claim_ocr_scan records one scan per call until the user has p_daily_limit scans
-- today (Japan time), counts only the caller's own scans, and ocr_scans is private to each user
begin;
select plan(22);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000c1', 'ocr-a@example.com'),
  ('00000000-0000-4000-8000-0000000000c2', 'ocr-b@example.com'),
  ('00000000-0000-4000-8000-0000000000c3', 'ocr-c@example.com'),
  ('00000000-0000-4000-8000-0000000000c4', 'ocr-d@example.com');

-- C scanned 5 times just before midnight Japan time yesterday; D once right at midnight Japan time today
insert into ocr_scans (user_id, created_at)
select '00000000-0000-4000-8000-0000000000c3',
       ((now() at time zone 'Asia/Tokyo')::date::timestamp at time zone 'Asia/Tokyo') - interval '1 second'
from generate_series(1, 5);
insert into ocr_scans (user_id, created_at) values
  ('00000000-0000-4000-8000-0000000000c4',
   (now() at time zone 'Asia/Tokyo')::date::timestamp at time zone 'Asia/Tokyo');

-- Structure
select is(
  (select p.prosecdef from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'claim_ocr_scan'),
  false,
  'claim_ocr_scan is SECURITY INVOKER, so RLS applies inside it'
);
select ok(
  (select exists (
     select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace,
       unnest(p.proconfig) c
     where n.nspname = 'public' and p.proname = 'claim_ocr_scan' and c like 'search_path=%')),
  'claim_ocr_scan pins its search_path'
);
select ok(
  not has_function_privilege('anon', 'public.claim_ocr_scan(integer)', 'EXECUTE'),
  'anon cannot execute claim_ocr_scan'
);
select ok(
  has_function_privilege('authenticated', 'public.claim_ocr_scan(integer)', 'EXECUTE'),
  'authenticated can execute claim_ocr_scan'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.ocr_scans'::regclass),
  'ocr_scans has RLS enabled'
);

-- As user A: claims pass up to the limit, then stop
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);

select is(claim_ocr_scan(3), true, 'A''s 1st scan of the day (limit 3) is allowed');
select is(claim_ocr_scan(3), true, 'A''s 2nd scan of the day is allowed');
select is(claim_ocr_scan(3), true, 'A''s 3rd scan of the day is allowed');
select is(claim_ocr_scan(3), false, 'A''s 4th scan of the day is refused');
select is(claim_ocr_scan(3), false, 'A stays refused after reaching the limit');
select is(
  (select count(*) from ocr_scans where user_id = '00000000-0000-4000-8000-0000000000c1'),
  3::bigint,
  'only the allowed scans are recorded, as A''s own rows'
);

-- As user B: A's scans do not count, and A's rows are invisible
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c2","role":"authenticated"}', true);

select is(claim_ocr_scan(3), true, 'B''s 1st scan is allowed although A used up the limit');
select is_empty(
  $$ select id from ocr_scans where user_id = '00000000-0000-4000-8000-0000000000c1' $$,
  'B cannot see A''s scans'
);
select is(
  (select count(*) from ocr_scans),
  1::bigint,
  'B sees only their own scan'
);
select throws_ok(
  $$ insert into ocr_scans (user_id) values ('00000000-0000-4000-8000-0000000000c1') $$,
  '42501',
  null,
  'B cannot record a scan as A'
);
select is(claim_ocr_scan(3), true, 'B''s 2nd scan is allowed');
select is(claim_ocr_scan(3), true, 'B''s 3rd scan is allowed');
select is(claim_ocr_scan(3), false, 'B''s 4th scan is refused: the limit is per user');

-- As user C: yesterday's scans (Japan time) do not count toward today
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated"}', true);

select is(claim_ocr_scan(1), true, 'C''s 5 scans from yesterday (Japan time) do not count toward today');
select is(claim_ocr_scan(1), false, 'C''s scan made today counts');

-- As user D: a scan at midnight Japan time belongs to today
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c4","role":"authenticated"}', true);

select is(claim_ocr_scan(1), false, 'D''s scan at 00:00 Japan time today counts toward today');

-- As anon
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$ select claim_ocr_scan(20) $$,
  '42501',
  null,
  'anon is refused when calling claim_ocr_scan'
);

reset role;
select * from finish();
rollback;
