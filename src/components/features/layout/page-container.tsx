import { cn } from "@/utils";

type PageContainerProps = {
  className?: string;
  children: React.ReactNode;
};

/** Page content wrapper with bottom nav spacing */
const PageContainer = ({ className, children }: PageContainerProps) => {
  return (
    <main
      className={cn("flex-1 pb-20", className)}
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      {children}
    </main>
  );
};

export { PageContainer };
