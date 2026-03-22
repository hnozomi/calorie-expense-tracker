import { cn } from "@/utils";

type HeaderProps = {
  title: string;
  className?: string;
  children?: React.ReactNode;
};

/** Sticky page header with glass-morphism effect and title with optional actions */
const Header = ({ title, className, children }: HeaderProps) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center justify-between px-4",
        "bg-background/80 backdrop-blur-lg",
        "border-b border-brand-border",
        className,
      )}
    >
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
};

export { Header };
