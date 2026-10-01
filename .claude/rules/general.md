# このアプリの規約

書き方の規約は全アプリ共通の `~/base/apps/.claude/rules/`(general / components / workflow / reports)にある。ここには、このアプリの構成と、共通規約と違う点だけを書く。

## ファイル配置

```
src/
  app/                        ルーティング。features のページ部品を呼ぶ
  components/
    features/<feature>/       機能ごと
      components/             描画する部品
      hooks/                  その機能のロジック(state、イベント処理、TanStack Query)
      api/ または queries.ts  データの取得・更新
      types/                  その機能の型
      stores/                 その機能の Jotai の atom
      utils/                  その機能の純粋な関数
      <feature>-page.tsx      ページ部品
      index.ts                公開するものの再 export
    ui/<component>/           汎用部品(shadcn/ui とその派生)
  hooks/                      複数の機能で使う hooks(TanStack Query のキーは query-keys.ts)
  types/                      複数の機能で使う型(Supabase の型は database.ts)
  utils/                      機能に依存しない純粋な関数(`cn()` は utils/cn.ts)
  lib/supabase/               Supabase のクライアント
  __tests__/                  テスト
```

- 中身のないフォルダは作らない
- shadcn/ui の部品は `pnpm dlx shadcn@latest add <component>` で足し、`ui/<component>/` に置く

## 共通規約と違う点

- **テストの置き場所**:共通規約は「対象の隣」だが、このアプリは `src/__tests__/` にまとめている。新しいテストもここに置く

既存のコードには、共通規約より前の書き方も残っている。それだけを理由に書き換えず、触ったファイルから共通規約に寄せる。

- コンポーネントを `export { X }` でファイル末尾から export し、props の型を `XxxProps` にしている(共通規約は `export const X` と `type Props`)
- ページ・レイアウトを `export default function` で書いている(共通規約はアロー関数)
- 関数ごとに説明コメントを付けている(共通規約は「なぜ」だけ)
- 「ロジックが10行を超えたらフックに出す」としていた(共通規約はロジックをすべてフックに置く)
