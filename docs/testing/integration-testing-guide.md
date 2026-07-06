# 統合(コンポーネント)テスト(IT)ガイド

対象: 1コンポーネント(+内包するフック・フォーム)の「ユーザー操作 → 表示/コールバック」、および複雑なフック単体。
ツール想定: Vitest + Testing Library + jsdom。全体方針は [フロントエンドテスト戦略](./frontend-testing-strategy.md) を参照。

## 1. 対象と粒度

- **単位はコンポーネント1つ**(カード、フォーム、モーダル、セレクタ、チャート)。ページ全体の結合はE2Eの仕事
- コンポーネントが呼ぶ**フック・フォームライブラリ・zodスキーマは本物**を使う。外部I/O(データ取得フック、mutation、router)だけをモックする
- 子コンポーネントもモックせず実物で描画する(浅いレンダリングはしない)
- **コントローラ系フック単体**(状態機械・複数mutation・画面ロジックを持つもの)もこのレイヤー(§5)

## 2. セットアップ基盤(最初に用意するもの)

### renderWithProviders

Provider(QueryClient、状態管理、テーマ等)を必要とするコンポーネントのために、共通のrenderヘルパーを最初に作る:

```tsx
// src/__tests__/test-utils.tsx
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }, // テストではリトライ無効に
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};
```

- `retry: false` は必須(エラー系テストがリトライ待ちでタイムアウトする)
- QueryClientは**テストごとに生成**(キャッシュの漏れ防止)

### jsdomの限界とポリフィル

jsdomは実レイアウトを持たない。UIライブラリが要求するAPIはsetupファイルでポリフィルする:

| 未実装API | 要求する典型ライブラリ | 対処 |
|-----------|----------------------|------|
| `matchMedia` | テーマ・レスポンシブ系 | スタブを定義 |
| `ResizeObserver` / `IntersectionObserver` | チャート、仮想リスト | スタブを定義 |
| `hasPointerCapture` / `setPointerCapture` | ドロワー・スライダー系(vaul、Radix) | スタブを定義 |
| `scrollIntoView` | セレクトボックス系 | no-opを定義 |

**jsdomで検証できないもの**(スクロール位置、実座標、CSSによる可視/不可視、sticky挙動)はITの対象外——見た目が絡むならE2E/ビジュアルリグレッションへ。

## 3. 何を検証するか: 状態マトリクス

コンポーネントごとに、存在する状態を列挙して各1ケース書く:

| 状態 | 検証例 |
|------|--------|
| 空(0件) | 空状態メッセージ+次のアクション(CTA)が出る |
| 検索ヒットなし | 「未登録」とは違う文言が出る(区別されているか) |
| ローディング | スケルトン/スピナーが出る |
| エラー | エラー表示が出る(黙って空になっていないか) |
| データあり | 値・単位・丸め・リンク先(href)が正しい |
| **操作中(pending)** | ボタンがdisabled+ラベル変化(**二度押し防止**。バグの温床なので必須) |

加えて操作系:

| 操作 | 検証例 |
|------|--------|
| フォーム入力→送信 | onSubmit相当のコールバックが**正しい引数**で呼ばれる |
| バリデーション | 不正入力→エラー文言が**画面に表示**される・コールバックが呼ばれない |
| 確認ダイアログ | 出現→キャンセルで何も起きない/実行でコールバック発火(**両分岐**) |
| 破棄ガード | 未保存で閉じる→確認が出る/クリーンなら出ない |

## 4. クエリ(セレクタ)規約

優先順位: **`getByRole`(name付き) > `getByLabelText` > `getByText` > `getByPlaceholderText` >>> `getByTestId`(最終手段)**

- roleで取れない → プロダクト側のa11y不足(label無しinput、aria-label無しアイコンボタン)。**テストを曲げずにプロダクトを直す**。テストがa11yの検査器を兼ねる
- 同名要素の strict mode violation → `exact: true`、スコープ絞り(`within(dialog)`)、またはUI文言の見直し(ユーザーも区別できていない可能性)

## 5. コントローラ系フックのテスト(renderHook)

状態機械や複数のmutationを束ねるフック(登録ドロワーの制御、モーダルの編集制御など)は、コンポーネント越しだと分岐網羅が難しい。**フック単体を `renderHook` でテストする**:

```tsx
vi.mock("../hooks/use-register-items", () => ({
  useRegisterItems: () => ({ mutateAsync: mockRegister, isPending: false }),
}));

it("下書きが残った状態で閉じると確認フラグが立つ", () => {
  const { result } = renderHook(() => useRegisterDrawerController(), {
    wrapper: ProvidersWrapper, // renderWithProvidersと同じProvider構成
  });
  act(() => result.current.handleManualAdd(itemFixture()));
  act(() => result.current.handleOpenChange(false));
  expect(result.current.isDiscardConfirmOpen).toBe(true);
});
```

- 検証するのは**フックの公開API(返り値と、依存モックへ渡った引数)**。内部stateの変数名には触れない
- 状態遷移(開く→入力→閉じる→確認→破棄/継続)をデシジョンテーブル的に列挙して網羅する
- ここで分岐を網羅すれば、E2Eは代表フロー1本で足りる

## 6. モック戦略

### モックの境界は「フック単位」を基本にする

```ts
vi.mock("@/features/recipes/hooks/use-recipes", () => ({
  useRecipes: () => ({ data: [recipeFixture()], isLoading: false }),
}));
```

- 利点: 速い・宣言的・ネットワーク層の知識が不要
- **弱点(モックドリフト)**: フックの戻り値の型を変えてもテストは通り続ける。対策: (a) フィクスチャに実型を付ける(`satisfies Recipe`)、(b) フックのシグネチャ変更時に `grep "vi.mock"` で該当テストを洗う
- 規模が大きくなり「APIレスポンス形式に対する挙動」まで守りたくなったら **MSW**(ネットワーク境界のモック)へ移行を検討。フック実装も含めてテストでき、ドリフトに強い

### モックしないもの

フォームライブラリ(react-hook-form)、バリデーションスキーマ、UIプリミティブ、子コンポーネント。これらを偽物にすると「テストは通るが実物は壊れる」統合テストになる。

### フィクスチャ規約

```ts
/** Overrides付きファクトリを1箇所に。デフォルトは「最も普通の」値 */
const createRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: "recipe-1", name: "テストレシピ", calories: 500, ...overrides,
});
```

テストごとに必要な差分だけ `overrides` で渡す。値の意図(なぜ500か)がテスト側に現れる。

## 7. 操作と非同期

- **`userEvent` を使う**(`fireEvent` は最終手段)。実際のイベント連鎖(focus→keydown→input)を再現し、disabledなら失敗してくれる
- 非同期の出現待ちは `await findByRole(...)` / `await waitFor(...)`。**`setTimeout`・任意のsleepは禁止**
- 消えるのを待つ: `waitForElementToBeRemoved` または `expect(...).toHaveCount(0)` 系
- タイマー系(debounce等)は `vi.useFakeTimers` + `advanceTimersByTime` で決定的に

## 8. 書かなくてよいもの

- バリデーションの**全分岐**(UTで済ませ、ITは「エラーが表示される」代表1件)
- CSSの見た目・レイアウト(必要ならビジュアルリグレッションで)
- データ取得フック自体のロジック(コンポーネントテストではモックしているので検証不能。複雑なフックは§5でフック単体をテスト)

## 9. アンチパターン

| アンチパターン | 問題 | 代替 |
|---------------|------|------|
| `container.querySelector(".btn-primary")` | 実装詳細依存・a11y検査にならない | `getByRole("button", { name: "保存" })` |
| モックの呼び出し回数だけを検証 | 振る舞いでなく実装のテスト | 画面の変化 or コールバック引数を検証 |
| 1つの巨大テストで全操作を通す | 落ちた時に原因不明・後続の検証が実行されない | 状態・操作ごとにケースを分割 |
| `render` 結果のスナップショット | 差分レビュー不能 | 意味のある要素を明示的にassert |
| act警告の握り潰し | 非同期更新の取りこぼし | `await` 漏れを直す(警告は待ち忘れのシグナル) |
