# めしログ（MeshiLog）

## プロジェクト概要

毎日の食事をサクッと記録して、カロリー・PFCバランス・食費をまるごと管理できるパーソナル食事管理PWA。

| 項目 | 内容 |
| --- | --- |
| プラットフォーム | Webアプリ（PWA）→ スマートフォン利用想定 |
| 技術スタック | Next.js 16 / TypeScript / Tailwind CSS v4 / shadcn/ui / Supabase / Tesseract.js |
| 想定ユーザー | 個人利用（シングルユーザー） |
| UIテイスト | シンプル・ミニマル（白基調） |

---

## 主な設計上の決定事項

| 決定事項 | 内容 |
| --- | --- |
| 食費管理方式 | 食材・商品ごとの単価管理（meal_item_costs） |
| レシピ栄養素 | 完成品の合計を手動入力（材料からの自動計算なし） |
| OCRアプローチ | テキスト抽出→正規表現ベース→手動修正 |
| 目標値設定 | なし（記録のみ、目標トラッキングなし） |
| セットメニュー | レシピ＋食品マスタの組み合わせをプリセット保存 |
| 食事登録方式 | カード方式（複数アイテム一括登録） |
| レシピ人数計算 | 食事登録時に1人分算出（人数セレクターで調整） |
| 削除方式 | 論理削除（deleted_atカラム） |
| 認証・データ保護 | Supabase Auth + RLS（user_idベース） |
| 献立→食事転記 | ホーム画面にバナー表示→カードにプリセット→確認後登録 |

---

## ドキュメント構成

| ファイル | 内容 |
| --- | --- |
| [01-features-usecases.md](./01-features-usecases.md) | 機能一覧・ユースケース |
| [02-screen-interaction.md](./02-screen-interaction.md) | 画面構成・インタラクション仕様 |
| [03-db-design.md](./03-db-design.md) | DB設計 |
| [04-api-tech-stack.md](./04-api-tech-stack.md) | API設計・技術スタック |
| [05-development-tasks.md](./05-development-tasks.md) | 開発タスク |
| [06-ssr-csr-data-fetching.md](./06-ssr-csr-data-fetching.md) | SSR/CSR データフェッチ設計 |
| [07-frontend-architecture.md](./07-frontend-architecture.md) | フロントエンド設計ガイド |

---

## 開発フェーズ

| フェーズ | 期間目安 | 内容 |
| --- | --- | --- |
| Phase 1: MVP | 2〜3週間 | Supabase構築・食事記録CRUD・デイリーサマリー |
| Phase 2: OCR・マスタ | 1〜2週間 | Tesseract.js統合・食品マスタCRUD |
| Phase 3: レシピ・セット | 1〜2週間 | レシピ・セットメニュー機能 |
| Phase 4: 献立・レポート | 1〜2週間 | 献立カレンダー・ウィークリーレポート |
| Phase 5: 改善 | 継続的 | UIブラッシュアップ・オフライン・CSVエクスポート |
