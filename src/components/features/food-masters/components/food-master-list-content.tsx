import { Plus, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { getFoodMasters } from "@/components/features/food-masters/api/queries";
import { Button } from "@/components/ui/button";
import { matchesSearch } from "@/utils";
import { FoodMasterCard } from "./food-master-card";

type Props = {
  query: string;
};

// The whole list is already read (and cached) for the other screens, so the search narrows it here instead of asking the DB again
export const FoodMasterListContent = async ({ query }: Props) => {
  const foodMasters = (await getFoodMasters()).filter((foodMaster) =>
    matchesSearch([foodMaster.name, foodMaster.brand], query),
  );

  if (foodMasters.length === 0) {
    return (
      <div className="flex flex-col items-center py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {query
            ? "該当する食品が見つかりません"
            : "食品マスタがまだ登録されていません"}
        </p>
        {query ? (
          <p className="mt-1 text-xs text-muted-foreground/70">
            別のキーワードで検索してみてください
          </p>
        ) : (
          <Button variant="outline" className="mt-4 rounded-full" asChild>
            <Link href="/other/food-masters/new">
              <Plus className="mr-1.5 h-4 w-4" />
              最初の食品を登録する
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5 px-4 pb-4 pt-1">
      {foodMasters.map((foodMaster) => (
        <FoodMasterCard
          key={foodMaster.id}
          foodMaster={foodMaster}
          href={`/other/food-masters/${foodMaster.id}`}
        />
      ))}
    </div>
  );
};
