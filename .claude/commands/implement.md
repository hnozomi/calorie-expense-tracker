機能を実装します。

## Input
- `$ARGUMENTS`: 実装する機能名や説明
- `docs/design.md`（存在すれば自動で読み込む）
- `docs/requirements.md`（存在すれば自動で読み込む — 仕様の参照元）

## Output
- ソースコード（`src/` 配下）

## 指示

`$ARGUMENTS` で指定された機能を実装します。

### 事前準備
1. `docs/requirements.md` が存在すれば読み込み、該当機能の受入基準を確認する
2. `docs/design.md` が存在すれば読み込む
3. 実装対象の機能に関連する既存コードを確認する

### 実装順序
以下の順序でステップごとに実装してください:

1. **型定義** — `src/types/` に必要な型を追加
2. **バックエンド** — テーブル・アクセス制御が必要な場合はマイグレーション SQL を提示
3. **サーバーロジック** — Server Components, Server Actions, Route Handlers
4. **クライアントコンポーネント** — `src/components/features/` に UI コンポーネントを実装
5. **状態管理** — Jotai atoms（`src/stores/`）、TanStack Query hooks（`src/hooks/`）
6. **ページ統合** — `src/app/` にページを作成し、コンポーネントを組み合わせる

### ルール
- `.claude/rules/` のすべてのコーディングルールに従う
- 各ステップ後に `pnpm lint` を実行し、エラーがあれば修正する
- 大きな変更の場合はステップごとにユーザーに確認を求める
- 既存のユーティリティ（`cn()`, Providers 等）を再利用する
- 新しい shadcn/ui コンポーネントが必要な場合は `pnpm dlx shadcn@latest add [component]` で追加する
- 実装完了後、受入基準を満たしているか確認し、不足があればユーザーに報告する
- 完了後、`/review` でレビューすることを案内する
