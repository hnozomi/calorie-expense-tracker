import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export const PlanMenuTabsList = () => (
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="manual" className="text-xs">
      手動
    </TabsTrigger>
    <TabsTrigger value="recipe" className="text-xs">
      レシピ
    </TabsTrigger>
    <TabsTrigger value="food_master" className="text-xs">
      マスタ
    </TabsTrigger>
    <TabsTrigger value="set_menu" className="text-xs">
      セット
    </TabsTrigger>
  </TabsList>
);
