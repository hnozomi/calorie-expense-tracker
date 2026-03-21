import { cn } from "@/utils";

type HeaderProps = {
  title: string;
  className?: string;
  children?: React.ReactNode;
};

/** Sticky page header with title and optional actions */
const Header = ({ title, className, children }: HeaderProps) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4",
        className,
      )}
    >
      <h1 className="text-lg font-semibold">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
};

export { Header };
