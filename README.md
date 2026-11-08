# めしログ(calorie-expense-tracker)

食事のカロリー・PFC・食費を記録し、献立とレシピ・食品マスタ・セットメニューから登録できる個人用の PWA。栄養成分表示は写真を撮ると読み取る。

本番: https://calorie-expense-tracker.vercel.app

## Tech Stack

| カテゴリ | 技術 |
|----------|------|
| Framework | Next.js (App Router, `cacheComponents`) + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| State | Server Components + Server Actions (server data), Jotai (the meal drawer) |
| Forms | React Hook Form + Zod |
| Backend | Supabase (DB + Auth) |
| OCR | Claude Haiku 5.5 (Server Action) |
| PWA | Custom Service Worker |
| Lint/Format | Biome, ESLint (React Compiler rules), Knip |
| Test | Vitest + Testing Library, Playwright |
| Package Manager | pnpm |

## Getting Started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

http://localhost:3000 で開発サーバーが起動する。E2E はローカルの Supabase(`supabase start`)にだけつなぐ。

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` / `pnpm lint:fix` | Lint with Biome / auto-fix |
| `pnpm lint:react` | React Compiler rules on ESLint |
| `pnpm knip` | Unused files, exports and dependencies |
| `pnpm test:run` | Run unit tests once |
| `pnpm e2e` | Run Playwright E2E tests against local Supabase |

## Docs

- 開発の決まり: `CLAUDE.md`、`.claude/rules/general.md`
- 今の作り: `docs/ui-tech.md`、権限: `docs/security-model.md`、テスト: `docs/testing/`、`docs/e2e-test-design.md`
