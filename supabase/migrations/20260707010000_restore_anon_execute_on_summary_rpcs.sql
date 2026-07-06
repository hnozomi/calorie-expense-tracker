-- The security_hardening migration revoked EXECUTE from anon on all RPCs,
-- which broke Vercel builds: SSG prerendering of /other/report (and /home)
-- runs the summary queries with the anon key at build time and got
-- "permission denied for function get_weekly_summary" (42501).
--
-- Restoring anon EXECUTE on the two read-only summary functions is safe now
-- that they are SECURITY INVOKER: anon has auth.uid() = NULL, every RLS
-- policy evaluates to false, and the functions return zero rows.
-- Write RPCs stay authenticated-only.

GRANT EXECUTE ON FUNCTION public.get_daily_summary(DATE) TO anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_summary(DATE) TO anon;
