"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SetMenu } from "../types/set-menu";

type SetMenuCardProps = {
  setMenu: SetMenu;
  onClick: () => void;
};

/** Card displaying a set menu's name, items, and totals */
const SetMenuCard = ({ setMenu, onClick }: SetMenuCardProps) => {
  return (
    <Card className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{setMenu.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {setMenu.items.map((item) => (
                <Badge key={item.id} variant="outline" className="text-xs">
                  {item.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">
              {Math.round(setMenu.totalCalories)}{" "}
              <span className="text-xs text-muted-foreground">kcal</span>
            </p>
            {setMenu.totalCost > 0 && (
              <p className="text-xs text-muted-foreground">
                ¥{Math.round(setMenu.totalCost)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-1.5">
          <span className="text-xs text-muted-foreground">
            P:{setMenu.totalProtein.toFixed(1)} F:
            {setMenu.totalFat.toFixed(1)} C:{setMenu.totalCarbs.toFixed(1)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export { SetMenuCard };
