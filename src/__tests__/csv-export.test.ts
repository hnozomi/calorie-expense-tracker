import { describe, expect, it, vi } from "vitest";
import { downloadCsv, toCsv } from "@/utils";

describe("toCsv", () => {
  it("generates CSV with BOM, headers, and data rows", () => {
    const headers = [
      { key: "name" as const, label: "名前" },
      { key: "value" as const, label: "値" },
    ];
    const rows = [
      { name: "A", value: 100 },
      { name: "B", value: 200 },
    ];

    const csv = toCsv(headers, rows);
    expect(csv).toBe("\uFEFF名前,値\nA,100\nB,200");
  });

  it("starts with UTF-8 BOM for Excel compatibility", () => {
    const csv = toCsv([{ key: "x" as const, label: "X" }], []);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("returns only headers when rows are empty", () => {
    const csv = toCsv(
      [
        { key: "a" as const, label: "A" },
        { key: "b" as const, label: "B" },
      ],
      [],
    );
    expect(csv).toBe("\uFEFFA,B\n");
  });

  it("wraps fields containing commas in quotes", () => {
    const csv = toCsv([{ key: "name" as const, label: "名前" }], [
      { name: "カレー,ライス" },
    ]);
    expect(csv).toContain('"カレー,ライス"');
  });

  it("escapes double quotes by doubling them", () => {
    const csv = toCsv([{ key: "name" as const, label: "名前" }], [
      { name: 'テスト"値"' },
    ]);
    expect(csv).toContain('"テスト""値"""');
  });

  it("wraps fields containing newlines in quotes", () => {
    const csv = toCsv([{ key: "memo" as const, label: "メモ" }], [
      { memo: "行1\n行2" },
    ]);
    expect(csv).toContain('"行1\n行2"');
  });

  it("handles null values as empty strings", () => {
    const csv = toCsv([{ key: "name" as const, label: "名前" }], [
      { name: null },
    ]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("");
  });

  it("handles undefined values as empty strings", () => {
    const csv = toCsv([{ key: "name" as const, label: "名前" }], [
      { name: undefined },
    ]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("");
  });

  it("handles numeric values", () => {
    const csv = toCsv(
      [
        { key: "calories" as const, label: "カロリー" },
        { key: "cost" as const, label: "食費" },
      ],
      [{ calories: 500.5, cost: 0 }],
    );
    const lines = csv.split("\n");
    expect(lines[1]).toBe("500.5,0");
  });

  it("handles multiple rows correctly", () => {
    const csv = toCsv(
      [
        { key: "id" as const, label: "ID" },
        { key: "name" as const, label: "名前" },
      ],
      [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 3, name: "C" },
      ],
    );
    const lines = csv.split("\n");
    // BOM + header + 3 data rows
    expect(lines).toHaveLength(4);
  });

  it("preserves column order from headers", () => {
    const csv = toCsv(
      [
        { key: "z" as const, label: "Z列" },
        { key: "a" as const, label: "A列" },
      ],
      [{ z: "last", a: "first" }],
    );
    const headerLine = csv.replace("\uFEFF", "").split("\n")[0];
    expect(headerLine).toBe("Z列,A列");
  });
});

describe("downloadCsv", () => {
  it("creates a blob and triggers download", () => {
    const mockClick = vi.fn();
    const mockCreateElement = vi.spyOn(document, "createElement");
    const mockCreateObjectURL = vi.fn().mockReturnValue("blob:test-url");
    const mockRevokeObjectURL = vi.fn();

    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;

    mockCreateElement.mockReturnValue({
      href: "",
      download: "",
      click: mockClick,
    } as unknown as HTMLAnchorElement);

    downloadCsv("test,data", "test.csv");

    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");

    mockCreateElement.mockRestore();
  });
});
