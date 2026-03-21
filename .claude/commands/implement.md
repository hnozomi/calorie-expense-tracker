機能を実装します。

## Input
- `$ARGUMENTS`: 実装するフェーズ・サブステップ（例: "フェーズ 1-2: 認証"）
- `docs/design.md`（存在すれば自動で読み込む）
- `docs/requirements.md`（存在すれば自動で読み込む — 仕様の参照元）

## Output
- ソースコード（`src/` 配下）

## 指示

`$ARGUMENTS` で指定された範囲を実装します。

### 事前準備
1. `docs/requirements.md` が存在すれば読み込み、該当機能の受入基準を確認する
2. `docs/design.md` が存在すれば読み込み、該当フェーズの実装対象ファイル・画面設計・型定義・テーブル設計を確認する
3. 実装対象の機能に関連する既存コードを確認する

### 実装順序
以下の順序でステップごとに実装してください:

1. **型定義** — 各 feature の `types/` に必要な型を追加
2. **バックエンド** — テーブル・アクセス制御が必要な場合はマイグレーション SQL を作成
3. **Server Actions** — 各 feature の `api/actions.ts` にサーバーロジックを実装
4. **データ取得/更新 hooks** — 各 feature の `api/use-*.ts` に TanStack Query hooks を実装
5. **UI ロジック hooks** — 各 feature の `hooks/use-*.ts` にフォーム制御・状態管理を実装
6. **UI コンポーネント** — 各 feature の `components/` に描画のみのコンポーネントを実装
7. **ページコンポーネント** — 各 feature 直下に `*-page.tsx` を実装
8. **ルーティング** — `src/app/` にページを作成し、Page コンポーネントを呼び出す
9. **バレルエクスポート** — 各階層の `index.ts` を更新

### ディレクトリ配置ルール
- ドメイン固有の型 → `src/components/features/{feature}/types/`
- ドメイン固有の状態 → `src/components/features/{feature}/stores/`
- Server Actions + データ取得/更新 hooks → `src/components/features/{feature}/api/`
- UI ロジック hooks → `src/components/features/{feature}/hooks/`
- UI コンポーネント（描画のみ）→ `src/components/features/{feature}/components/`
- ページコンポーネント → `src/components/features/{feature}/` 直下
- 共通 hooks → `src/hooks/`
- 共通ユーティリティ → `src/utils/`
- ベース UI → `src/components/ui/`

### ルール
- `.claude/rules/` のすべてのコーディングルールに従う
- 各ステップ後に `pnpm lint` を実行し、エラーがあれば修正する
- 大きな変更の場合はステップごとにユーザーに確認を求める
- 既存のユーティリティ（`cn()`, Providers 等）を再利用する
- 新しい shadcn/ui コンポーネントが必要な場合は `pnpm dlx shadcn@latest add [component]` で追加する
- 実装完了後、受入基準を満たしているか確認し、不足があればユーザーに報告する
- 完了後、`/review` でレビューすることを案内する
