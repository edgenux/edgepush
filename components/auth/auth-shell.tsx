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
    <div className="flex min-h-screen min-w-0 flex-col bg-canvas">
      <header className="flex h-12 items-center border-b border-kumo-hairline bg-kumo-base px-3 sm:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-3 pb-12 pt-8 sm:px-4 sm:pb-16 sm:pt-12 md:pt-16">
        <div className="w-full max-w-[400px] rounded-lg border border-kumo-hairline bg-kumo-base p-5 shadow-kumo-sm sm:p-8">
          <div className="mb-6 space-y-1">
            <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
            {description ? (
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {children}
          {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
