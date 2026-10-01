import Link from "next/link";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  showWordmark = true,
}: {
  href?: string;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 text-foreground", className)}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
        <Send className="h-3.5 w-3.5" />
      </span>
      {showWordmark && (
        <span className="font-cal text-lg font-semibold leading-none tracking-tight">
          MoePush
        </span>
      )}
    </Link>
  );
}
