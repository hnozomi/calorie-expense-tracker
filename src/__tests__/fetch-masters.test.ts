import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { fetchMasters } from "@/lib/fetch-masters";

type QueryResult = { data: { id: string }[] | null; error: Error | null };

const clientReturning = (results: Record<string, QueryResult>) => {
  const from = vi.fn((table: string) => ({
    select: () => ({ in: () => Promise.resolve(results[table]) }),
  }));
  return { client: { from } as unknown as SupabaseClient, from };
};

const ok = (id: string): QueryResult => ({ data: [{ id }], error: null });

describe("fetchMasters", () => {
  it("id ごとに引ける形で、食品マスタとレシピを返す", async () => {
    const { client } = clientReturning({
      food_masters: ok("food-1"),
      recipes: ok("recipe-1"),
    });

    const { foodMasterMap, recipeMap } = await fetchMasters(
      client,
      new Set(["food-1"]),
      new Set(["recipe-1"]),
    );

    expect(foodMasterMap.get("food-1")).toEqual({ id: "food-1" });
    expect(recipeMap.get("recipe-1")).toEqual({ id: "recipe-1" });
  });

  it("id が無い表には問い合わせない", async () => {
    const { client, from } = clientReturning({});

    const { foodMasterMap, recipeMap } = await fetchMasters(
      client,
      new Set(),
      new Set(),
    );

    expect(from).not.toHaveBeenCalled();
    expect(foodMasterMap.size).toBe(0);
    expect(recipeMap.size).toBe(0);
  });

  it("食品マスタの取得に失敗したら、空で返さず例外にする", async () => {
    const failure = new Error("food_masters failed");
    const { client } = clientReturning({
      food_masters: { data: null, error: failure },
      recipes: ok("recipe-1"),
    });

    await expect(
      fetchMasters(client, new Set(["food-1"]), new Set(["recipe-1"])),
    ).rejects.toBe(failure);
  });

  it("レシピの取得に失敗したら、空で返さず例外にする", async () => {
    const failure = new Error("recipes failed");
    const { client } = clientReturning({
      food_masters: ok("food-1"),
      recipes: { data: null, error: failure },
    });

    await expect(
      fetchMasters(client, new Set(["food-1"]), new Set(["recipe-1"])),
    ).rejects.toBe(failure);
  });
});
