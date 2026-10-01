import Link from "next/link";
import { cn } from "@/lib/utils";

export function CloudflareMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-10", className)}
      aria-hidden
    >
      <path
        fill="#F38020"
        d="M11.5 28.9c-3.1 0-5.8-1.7-7.2-4.3-1.1-2-1.3-4.3-.6-6.5l.1-.4.3-1c.6-1.9 1.9-3.5 3.6-4.6l.3-.2.6-.4c1.6-1.1 3.5-1.7 5.5-1.7.5 0 1 .1 1.5.2 1.4-3.2 4.2-5.6 7.7-6.4 3.5-.8 7.1.1 9.8 2.3 2 1.6 3.3 3.9 3.7 6.4h.7c3.3 0 6.2 1.8 7.7 4.6 1.5 2.8 1.5 6.1 0 8.9-1.5 2.8-4.4 4.6-7.7 4.6H11.5z"
      />
      <path
        fill="#FAAE40"
        d="M37.6 14.2h-1.1l-.2-.9c-.4-2.4-1.7-4.5-3.6-6-2.4-1.9-5.5-2.7-8.6-2-2.7.6-4.9 2.4-6.1 4.8l-.5 1-1-.4c-.7-.3-1.5-.4-2.3-.4-1.7 0-3.3.6-4.6 1.6l-.5.4-.3.2c-1.4.9-2.4 2.2-2.9 3.8l-.2.8-.1.3c-.5 1.7-.4 3.5.5 5.1 1.1 2 3.2 3.3 5.6 3.3h22.3c2.5 0 4.7-1.4 5.9-3.5 1.2-2.1 1.2-4.7 0-6.8-1.2-2.1-3.4-3.5-5.9-3.5h-.4z"
      />
    </svg>
  );
}

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
      className={cn("inline-flex items-center gap-2", className)}
    >
      <CloudflareMark />
      {showWordmark && (
        <span className="text-[15px] font-semibold leading-none tracking-tight text-kumo-text-brand">
          MoePush
        </span>
      )}
    </Link>
  );
}
