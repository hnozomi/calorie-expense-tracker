import { Camera, ScanLine } from "lucide-react";

type Props = {
  onOpenOcr: () => void;
};

export const FoodMasterOcrButton = ({ onOpenOcr }: Props) => (
  <button
    type="button"
    className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] px-4 py-3 transition-all hover:border-primary/50 hover:bg-primary/[0.06] active:scale-[0.98]"
    onClick={onOpenOcr}
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
      <ScanLine className="h-4.5 w-4.5 text-primary" />
    </div>
    <div className="text-left">
      <p className="text-sm font-medium">栄養成分表示をカメラで読み取り</p>
      <p className="text-xs text-muted-foreground">ラベルを撮影して自動入力</p>
    </div>
    <Camera className="ml-auto h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
  </button>
);
