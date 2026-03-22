"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PfcDisplay } from "@/components/ui/pfc-display";
import type { SetMenu } from "../types/set-menu";

type SetMenuCardProps = {
  setMenu: SetMenu;
  onClick: () => void;
};

/** Card displaying a set menu's name, items, and totals */
const SetMenuCard = ({ setMenu, onClick }: SetMenuCardProps) => {
  return (
    <Card
      className="cursor-pointer border-muted-foreground/10 transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-snug">
              {setMenu.name}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {setMenu.items.map((item) => (
                <Badge
                  key={item.id}
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-[11px] font-normal"
                >
                  {item.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <p className="text-lg font-bold leading-tight text-brand">
              {Math.round(setMenu.totalCalories)}
              <span className="ml-0.5 text-[11px] font-medium text-muted-foreground">
                kcal
              </span>
            </p>
            {setMenu.totalCost > 0 && (
              <p className="flex items-center text-xs font-medium text-muted-foreground">
                <span className="mr-0.5 text-[10px]">¥</span>
                {Math.round(setMenu.totalCost)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2">
          <PfcDisplay
            protein={setMenu.totalProtein}
            fat={setMenu.totalFat}
            carbs={setMenu.totalCarbs}
            size="sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export { SetMenuCard };
