import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-kumo-fill border-t-primary",
        className,
      )}
      aria-hidden
    />
  );
}
