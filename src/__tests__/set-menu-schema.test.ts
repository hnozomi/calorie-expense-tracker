import { describe, expect, it } from "vitest";
import { setMenuFormSchema } from "@/components/features/set-menus/types/set-menu";

describe("setMenuFormSchema", () => {
  it("accepts valid name", () => {
    const result = setMenuFormSchema.safeParse({ name: "朝定食セット" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = setMenuFormSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = setMenuFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts single character name", () => {
    const result = setMenuFormSchema.safeParse({ name: "A" });
    expect(result.success).toBe(true);
  });

  it("accepts long name", () => {
    const result = setMenuFormSchema.safeParse({
      name: "朝の定食セット（ご飯・味噌汁・焼き魚・漬物・サラダ付き）",
    });
    expect(result.success).toBe(true);
  });
});
