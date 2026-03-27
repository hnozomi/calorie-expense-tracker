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

## Deploy Checklist
- **Before `git push`**: Always run `pnpm build` and confirm it succeeds. Turbopack dev server skips TypeScript type checking and does not prerender pages, so errors only caught by production build will silently break Vercel deployments.
- **After `git push`**: Verify Vercel deployment status using `mcp__vercel__list_deployments`. Do not assume a push is deployed.

## Supabase Migrations
- `generate_series(DATE, DATE, INTERVAL)` returns `timestamp with time zone`, not `DATE`. Always cast explicitly with `::DATE` when the function signature expects `DATE`.
- Test RPC functions against the actual database schema before applying migrations. Type mismatches between SQL return types and function signatures cause runtime errors during SSG prerendering.

## Coding Rules
See `.claude/rules/` for detailed coding rules.
