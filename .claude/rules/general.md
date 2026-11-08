# このアプリの規約

書き方の規約は全アプリ共通の `~/base/apps/.claude/rules/`(general / components / workflow / reports)にある。ここには、このアプリの構成と、共通規約と違う点だけを書く。

## ファイル配置

```
src/
  app/                        ルーティング。features のページ部品を呼ぶ
  components/
    features/<feature>/       機能ごと
      components/             描画する部品
      hooks/                  その機能のロジック(state、イベント処理、Server Action の呼び出し)
      api/                    queries.ts(サーバーで読む)と actions.ts(Server Action)
      types/                  その機能の型
      stores/                 その機能の Jotai の atom
      utils/                  その機能の純粋な関数
      index.ts                公開するものの再 export
    ui/<component>/           汎用部品(shadcn/ui とその派生)
  hooks/                      複数の機能で使う hooks
  types/                      複数の機能で使う型(生成した型への上書きと行の型は database.ts)
  utils/                      機能に依存しない純粋な関数(`cn()` は utils/cn.ts)
  lib/supabase/               Supabase のクライアントと生成した型(database.types.ts)
  __tests__/                  テスト
```

- 中身のないフォルダは作らない
- 機能どうしの import は一方向にする。ocr は写真から栄養を読むところまでを持ち、読んだ結果を食事の1品にするフォーム(`OcrResultForm`)は meals に置く(ocr が meals のフォームと型を import して、meals ⇄ ocr と food-masters → ocr → meals → food-masters の輪ができていたため。2026-11-08)
- shadcn/ui の部品は `pnpm dlx shadcn@latest add <component>` で足し、`ui/<component>/` に置く

## 共通規約と違う点

- **テストの置き場所**:共通規約は「対象の隣」だが、このアプリは `src/__tests__/` にまとめている。新しいテストもここに置く
- **E2E の中のログイン**:ログイン・ログアウトそのものを確かめる E2E は、専用の利用者(`e2eSwitchUsers`)でテストの中でログインしてよい(共通規約は「テストの中でログインしない」)。ログアウトするとその利用者のセッションがすべて切れ、共通の `e2eUser` を壊すため
- **P・F・C の部品は `ui/pfc-display/`**:P・F・C の表示(`PfcDisplay`)と入力(`PfcInputCard`)は、文言と色を中に持つが `ui/` に置く(共通規約は「ドメイン知識を持たないものだけ」)。食事・献立・レシピ・マスタのすべてで同じ形を使い、機能をまたいで共有するため
- **フォルダの形**:共通規約は `features/<機能>/{server,logic}` と `src/db/` だが、このアプリは上の形のまま。全ファイルと 82 本のテストの移動が要るのに、動きは変わらないため(2026-11-07)
- **`members`・`is_member()` を持たない**:共通規約はすべてのポリシーで確かめるが、このアプリの RLS は `user_id` の持ち主だけを確かめる。本番の新規登録は止まっていてアカウントは固定の1つなので、足しても守れるものが増えないため(2026-11-07)。新規登録を開くなら先に足す

既存のコードには、共通規約より前の書き方も残っている。それだけを理由に書き換えず、触ったファイルから共通規約に寄せる。

- コンポーネントを `export { X }` でファイル末尾から export し、props の型を `XxxProps` にしている(共通規約は `export const X` と `type Props`)
- ページ・レイアウトを `export default function` で書いている(共通規約はアロー関数)
- 関数ごとに説明コメントを付けている(共通規約は「なぜ」だけ)
- 「ロジックが10行を超えたらフックに出す」としていた(共通規約はロジックをすべてフックに置く)
