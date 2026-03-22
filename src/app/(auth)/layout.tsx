/** Auth pages layout: centered content with warm background gradient */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-b from-brand-muted to-white px-4 dark:from-brand-muted dark:to-background">
      {children}
    </div>
  );
}
