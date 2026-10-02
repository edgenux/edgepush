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
        "flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-kumo-hairline bg-kumo-base px-4 py-10 text-center sm:min-h-[280px] sm:px-6 sm:py-12",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-kumo-recessed text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-semibold">{headline}</h2>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {button ? <div className="mt-6">{button}</div> : null}
    </div>
  );
}
