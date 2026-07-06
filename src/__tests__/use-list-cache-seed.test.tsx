import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useListCacheSeed } from "@/hooks";

type Row = { id: string; name: string };

const LIST_KEY_PREFIX = ["rows", "list"] as const;

/** Render the hook with a QueryClient pre-filled via setup(queryClient) */
const renderSeed = (
  id: string | undefined,
  setup?: (queryClient: QueryClient) => void,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  setup?.(queryClient);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useListCacheSeed<Row>(LIST_KEY_PREFIX, id), {
    wrapper,
  });
};

describe("useListCacheSeed", () => {
  it("キャッシュ済みの一覧からidが一致するレコードを返す", () => {
    const { result } = renderSeed("r2", (queryClient) => {
      queryClient.setQueryData(
        ["rows", "list", undefined],
        [
          { id: "r1", name: "一件目" },
          { id: "r2", name: "二件目" },
        ],
      );
    });
    expect(result.current?.data).toEqual({ id: "r2", name: "二件目" });
    expect(result.current?.updatedAt).toBeGreaterThan(0);
  });

  it("検索付きの一覧キャッシュ(キー末尾が異なる)にもプレフィックスでヒットする", () => {
    const { result } = renderSeed("r1", (queryClient) => {
      queryClient.setQueryData(
        ["rows", "list", "検索語"],
        [{ id: "r1", name: "検索結果" }],
      );
    });
    expect(result.current?.data).toEqual({ id: "r1", name: "検索結果" });
  });

  it("どの一覧にも存在しないidのときはundefinedを返す", () => {
    const { result } = renderSeed("missing", (queryClient) => {
      queryClient.setQueryData(
        ["rows", "list", undefined],
        [{ id: "r1", name: "一件目" }],
      );
    });
    expect(result.current).toBeUndefined();
  });

  it("idがundefinedのときはundefinedを返す", () => {
    const { result } = renderSeed(undefined, (queryClient) => {
      queryClient.setQueryData(
        ["rows", "list", undefined],
        [{ id: "r1", name: "一件目" }],
      );
    });
    expect(result.current).toBeUndefined();
  });

  it("キャッシュが空のときはundefinedを返す", () => {
    const { result } = renderSeed("r1");
    expect(result.current).toBeUndefined();
  });

  it("配列でないキャッシュ(詳細クエリ等)はクラッシュせず無視する", () => {
    const { result } = renderSeed("r1", (queryClient) => {
      // A non-array entry under the same prefix must not break the scan
      queryClient.setQueryData(["rows", "list", "broken"], {
        id: "r1",
        name: "単一オブジェクト",
      });
      queryClient.setQueryData(
        ["rows", "list", undefined],
        [{ id: "r1", name: "一覧から" }],
      );
    });
    expect(result.current?.data).toEqual({ id: "r1", name: "一覧から" });
  });
});
