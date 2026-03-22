import { cn } from "@/utils";

type SectionHeaderProps = {
  icon: React.ElementType;
  label: string;
  className?: string;
  iconBgClassName?: string;
  iconClassName?: string;
  children?: React.ReactNode;
};

/** Section header with icon badge and label */
const SectionHeader = ({
  icon: Icon,
  label,
  className,
  iconBgClassName,
  iconClassName,
  children,
}: SectionHeaderProps) => (
  <div className={cn("flex items-center gap-2 pb-1", className)}>
    <div
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-md bg-primary/10",
        iconBgClassName,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 text-primary", iconClassName)} />
    </div>
    <span className="text-sm font-semibold tracking-wide text-foreground/80">
      {label}
    </span>
    {children && <div className="ml-auto">{children}</div>}
  </div>
);

export { SectionHeader };
