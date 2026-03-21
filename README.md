# Next.js PWA Template

PWA 対応の Next.js アプリケーションテンプレート。

## Tech Stack

| カテゴリ | 技術 |
|----------|------|
| Framework | Next.js (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| State | Jotai (client) + TanStack Query (server) |
| Forms | React Hook Form + Zod |
| Backend | Supabase (optional) |
| PWA | Custom Service Worker |
| Lint/Format | Biome |
| Test | Vitest + Testing Library |
| Package Manager | pnpm |

## Getting Started

```bash
pnpm install
pnpm dev
```

http://localhost:3000 で開発サーバーが起動します。

## Supabase（オプション）

Supabase を使用する場合は `.env.example` を参考に `.env.local` を作成してください。

```bash
cp .env.example .env.local
```

環境変数が未設定の場合、Supabase 関連の処理はスキップされます。

## Directory Structure

```
src/
├── app/          # Pages and layouts
├── components/
│   └── ui/       # shadcn/ui components
├── hooks/        # Custom React hooks
├── lib/
│   ├── supabase/ # Supabase client utilities
│   └── utils.ts  # Shared utilities (cn, etc.)
├── stores/       # Jotai atoms
├── types/        # TypeScript type definitions
└── __tests__/    # Test files
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | Lint with Biome |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format with Biome |
| `pnpm test` | Run tests (watch mode) |
| `pnpm test:run` | Run tests once |

## Updating from Template

テンプレートの更新をアプリに取り込む場合:

```bash
git remote add upstream <template-repo-url>
git fetch upstream
git merge upstream/main
```
