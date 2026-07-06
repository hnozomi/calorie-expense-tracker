# Project: Next.js PWA Template

## Tech Stack
- **Framework**: Next.js (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS v4
- **State**: Jotai (client state) + TanStack Query (server state)
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase (DB + Auth) via `@supabase/ssr`
- **PWA**: Custom implementation (no external library)
- **Lint/Format**: Biome
- **Test**: Vitest + Testing Library
- **Package Manager**: pnpm

## Directory Structure
```
src/
├── app/              # Next.js App Router pages and layouts
├── components/
│   ├── features/     # Feature-specific components (e.g., features/tasks/)
│   └── ui/           # Base UI components (e.g., ui/button/, ui/card/)
├── hooks/            # Custom React hooks
├── lib/
│   └── supabase/     # Supabase client utilities
├── utils/            # Shared utility functions
├── stores/           # Jotai atoms
├── types/            # TypeScript type definitions
└── __tests__/        # Test files
```

## Commands
- `pnpm dev` — Start dev server (Turbopack)
- `pnpm build` — Production build
- `pnpm lint` — Lint with Biome
- `pnpm lint:fix` — Auto-fix lint issues
- `pnpm format` — Format with Biome
- `pnpm test` — Run tests in watch mode
- `pnpm test:run` — Run tests once
- `pnpm test:e2e` — Run Playwright E2E tests (starts its own dev server with `NEXT_PUBLIC_E2E=1`)

## E2E Tests
- Specs live in `e2e/`. They use a dedicated account (`E2E_EMAIL` / `E2E_PASSWORD` in `.env.local`, user exists in Supabase auth) whose data is wiped at the start of every run — never point them at a real account.
- Always use the helpers in `e2e/helpers.ts` (`gotoHydrated`, `fillStable`, `clickToReveal`, `loginViaUi`): input and clicks before React hydration are silently lost on the dev server.
- `NEXT_PUBLIC_E2E=1` hides the TanStack Query devtools button and the Next.js dev indicator, both of which overlap the bottom nav and intercept taps.

## Deploy Checklist
- **Before `git push`**: Always run `pnpm build` and confirm it succeeds. Turbopack dev server skips TypeScript type checking and does not prerender pages, so errors only caught by production build will silently break Vercel deployments.
- **After `git push`**: Verify Vercel deployment status using `mcp__vercel__list_deployments`. Do not assume a push is deployed.

## Supabase Migrations
- `generate_series(DATE, DATE, INTERVAL)` returns `timestamp with time zone`, not `DATE`. Always cast explicitly with `::DATE` when the function signature expects `DATE`.
- Test RPC functions against the actual database schema before applying migrations. Type mismatches between SQL return types and function signatures cause runtime errors during SSG prerendering.
- **Vercel SSG prerenders pages with the anon key at build time** (/home and /other/report call the summary RPCs during `next build`). Revoking anon EXECUTE on an RPC used by a prerendered page breaks the Vercel build with 42501. Keep anon EXECUTE on read-only SECURITY INVOKER functions used during prerender — RLS makes them return empty rows for anon. Local `pnpm build` (Turbopack) did NOT catch this while Vercel (`next build --webpack`) failed, so always verify the Vercel deployment after RPC permission changes.

## Testing Strategy
- Which layer (UT / IT / E2E) a test belongs to, coverage criteria, and the new-feature checklist are defined in `docs/testing/frontend-testing-strategy.md`, with per-layer guides in `docs/testing/`. This repo's concrete E2E cases live in `docs/e2e-test-design.md`.

## Test Integrity — making tests pass is a means, never the goal
Tests are statements of the spec. Rationale for these rules: `docs/testing/test-integrity-rationale.md`.

1. **Classify before touching**: when a test fails, first declare — with evidence — which of these it is: (a) implementation bug, (b) spec change requiring a test update, (c) defect in the test itself. If you cannot decide, change nothing and ask the user.
2. **Changing an expected value requires evidence other than the implementation**: "make it match the actual output" is forbidden. Only change expectations when you can cite a spec, a user instruction, or a design doc.
3. **Never do the following without the user's explicit approval**: disabling tests (`it.skip` / `test.todo` / commenting out / deletion), weakening assertions (`toBe(x)` → `toBeTruthy()`, exact → partial match, removing count checks), raising timeouts/retries to hide flakes without a root cause, blind snapshot updates, adding test-only branches to product code, or mocking the unit under test.
4. **Every relaxation needs an in-code comment stating why** (e.g. rate limiting changes an error message). `scripts/check-test-integrity.sh` (runs as part of `pnpm test:run`) flags banned patterns; legitimate exceptions carry `// integrity-allow: <reason>`.
5. **A previously passing test that fails after your change is presumed correct**: the default is "the code broke", and the burden of proof is on editing the test.
6. **If you cannot fix it, report it as failing** — never green it by weakening.

## Performance
- Navigation must be instant: use `<Link>` (with explicit `prefetch` for dynamic routes), never `router.push` for user-initiated navigation. Do not add blocking work (e.g. auth round-trips) to the middleware path for RSC requests. Seed detail queries from cached list data (`useListCacheSeed`) instead of refetching. See `docs/performance-issues-and-fixes.md` for past incidents and the pre-merge checklist.

## Coding Rules
See `.claude/rules/` for detailed coding rules.
