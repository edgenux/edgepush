import { Logo } from "@/components/brand/logo";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-12 items-center border-b border-kumo-hairline bg-kumo-base px-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-10 sm:pt-16">
        <div className="w-full max-w-[400px] rounded-lg border border-kumo-hairline bg-kumo-base p-6 shadow-kumo-sm sm:p-8">
          <div className="mb-6 space-y-1">
            <h1 className="text-xl font-semibold">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {children}
          {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
