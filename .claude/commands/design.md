技術設計書を作成します。

## Input
- `$ARGUMENTS`: 追加の指示や制約（任意）
- `docs/requirements.md`（存在すれば自動で読み込む）

## Output
- `docs/design.md`

## 指示

`docs/requirements.md` が存在すればまず読み込んでください。ユーザーの入力も考慮して技術設計書を作成します。

### 作成する内容

1. **ルート構成**
   - `src/app/` 配下のページ・レイアウト構成
   - 各ルートの役割（静的/動的、認証要否）

2. **ディレクトリ構成**
   - Feature ディレクトリ構成（`src/components/features/{feature}/` に api, components, types, stores, ページコンポーネントを集約）
   - 共通ディレクトリ構成（`src/hooks/` は共通 hooks のみ、`src/types/` は共通型のみ）
   - `src/components/ui/` の追加コンポーネント

3. **コンポーネント設計**
   - コンポーネント階層図
   - Server Component / Client Component の分類
   - page.tsx（Server）と Page コンポーネント（Client）の関係

4. **状態管理設計**
   - Jotai atoms → 各 feature の `stores/` に配置
   - TanStack Query のクエリキー設計 → `src/hooks/query-keys.ts` に共通配置
   - ドメイン hooks → 各 feature の `api/` に配置

5. **バックエンド設計**（該当する場合のみ）
   - テーブルスキーマ（カラム、型、制約）
   - アクセス制御ポリシー
   - 認証フロー（サインアップ、ログイン、セッション管理）

6. **PWA 設計**（該当する場合のみ）
   - Service Worker のキャッシュ戦略
   - オフライン対応範囲
   - プッシュ通知の実装方針

7. **実装順序**
   - フェーズ分けと各フェーズで実装するファイル一覧
   - 依存関係を考慮した順序

### ルール
- `.claude/rules/` のコーディングルールに従う
- 既存のテンプレートコード（providers.tsx 等）を活用する前提で設計する
- アプリに不要なセクション（バックエンド、PWA 等）はスキップする
- 不明点はユーザーに確認する
- 完成したら `docs/design.md` に保存する
- 保存後、次のステップとして `/implement` を案内する
