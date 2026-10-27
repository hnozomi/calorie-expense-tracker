import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { getSetMenus } from "@/components/features/set-menus/api/queries";
import { Button } from "@/components/ui/button";
import { matchesSearch } from "@/utils";
import { SetMenuCard } from "./set-menu-card";

type Props = {
  query: string;
};

// The whole list is already read (and cached) for the home drawer, so the search narrows it here instead of asking the DB again
export const SetMenuListContent = async ({ query }: Props) => {
  const setMenus = (await getSetMenus()).filter((setMenu) =>
    matchesSearch([setMenu.name], query),
  );

  if (setMenus.length === 0) {
    return (
      <div className="flex flex-col items-center py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ClipboardList className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {query
            ? "該当するセットメニューが見つかりません"
            : "セットメニューがまだ登録されていません"}
        </p>
        {query ? (
          <p className="mt-1 text-xs text-muted-foreground/70">
            別のキーワードで検索してみてください
          </p>
        ) : (
          <Button variant="outline" className="mt-4 rounded-full" asChild>
            <Link href="/other/set-menus/new">
              <Plus className="mr-1.5 h-4 w-4" />
              最初のセットメニューを登録する
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5 px-4 pb-4 pt-1">
      {setMenus.map((setMenu) => (
        <SetMenuCard
          key={setMenu.id}
          setMenu={setMenu}
          href={`/other/set-menus/${setMenu.id}`}
        />
      ))}
    </div>
  );
};
