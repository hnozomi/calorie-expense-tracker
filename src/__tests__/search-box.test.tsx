import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchBox } from "@/components/ui/search-box";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
}));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

const PLACEHOLDER = "レシピ名で検索...";

const renderSearchBox = (initialQuery = "") =>
  render(
    <SearchBox
      basePath="/recipes"
      initialQuery={initialQuery}
      placeholder={PLACEHOLDER}
    />,
  );

const searchField = () => screen.getByRole("searchbox", { name: PLACEHOLDER });

/** Type the text one key at a time, a short gap between keys like a person typing */
const typeInto = async (text: string) => {
  const field = searchField();
  let value = (field as HTMLInputElement).value;
  for (const key of text) {
    value += key;
    fireEvent.change(field, { target: { value } });
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
  }
};

const clearField = async () => {
  fireEvent.change(searchField(), { target: { value: "" } });
  await act(async () => {
    vi.advanceTimersByTime(0);
  });
};

/** Let the time after the last key pass, well beyond a typing pause */
const waitAfterTyping = async () => {
  await act(async () => {
    vi.advanceTimersByTime(1_000);
  });
};

describe("SearchBox (?q= の検索欄)", () => {
  it("AC-R-3: 開いたときの ?q= の検索語が検索欄に入っていて、開いただけでは URL を書き換えない", async () => {
    renderSearchBox("カレー");

    expect(searchField()).toHaveValue("カレー");
    await waitAfterTyping();
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("AC-R-3: 打たずに URL の ?q= が変わったら(戻る・進む、一覧へのリンク)、検索欄もその語になり、URL は書き換えない", async () => {
    const { rerender } = renderSearchBox("カレー");

    rerender(
      <SearchBox
        basePath="/recipes"
        initialQuery=""
        placeholder={PLACEHOLDER}
      />,
    );
    await waitAfterTyping();
    expect(searchField()).toHaveValue("");

    rerender(
      <SearchBox
        basePath="/recipes"
        initialQuery="鶏むね"
        placeholder={PLACEHOLDER}
      />,
    );
    await waitAfterTyping();
    expect(searchField()).toHaveValue("鶏むね");

    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("ui-tech フェーズ4: 打ち終わって少し後に、検索語を ?q= に入れた URL へ replace で書き換える(履歴を積まない)", async () => {
    renderSearchBox();

    await typeInto("鶏むね");
    await waitAfterTyping();

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(
      `/recipes?q=${encodeURIComponent("鶏むね")}`,
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("ui-tech フェーズ4: 打っている途中では URL を書き換えない", async () => {
    renderSearchBox();

    await typeInto("サラダ");

    expect(replace).not.toHaveBeenCalled();
    expect(searchField()).toHaveValue("サラダ");
  });

  it("ui-tech フェーズ4: 検索欄を空にすると ?q= を外した URL に戻す", async () => {
    renderSearchBox("カレー");

    await clearField();
    await waitAfterTyping();

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/recipes");
  });

  it("ui-tech フェーズ4: 空白だけを打っても検索語にはならず、?q= を付けない", async () => {
    renderSearchBox();

    await typeInto("   ");
    await waitAfterTyping();

    expect(replace).not.toHaveBeenCalled();
  });

  it("ui-tech フェーズ4: 記号を含む検索語は URL の中で壊れないように書く", async () => {
    renderSearchBox();

    await typeInto("A&B");
    await waitAfterTyping();

    const [[url]] = replace.mock.calls as [[string]];
    expect(new URL(url, "http://localhost").searchParams.get("q")).toBe("A&B");
  });
});
