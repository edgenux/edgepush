import { cn } from "@/lib/utils";

export function EmptyScreen({
  icon,
  headline,
  description,
  button,
  className,
}: {
  icon?: React.ReactNode;
  headline: string;
  description?: string;
  button?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col items-center justify-center rounded-md border border-dashed bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h2 className="font-cal text-xl font-semibold tracking-tight">{headline}</h2>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {button ? <div className="mt-6">{button}</div> : null}
    </div>
  );
}
