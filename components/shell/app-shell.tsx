"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, LayoutGrid, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/moe/endpoints", label: "接口", icon: KeyRound },
  { href: "/moe/channels", label: "渠道", icon: LayoutGrid },
];

interface AppShellProps {
  user?: {
    name?: string | null;
    image?: string | null;
    username?: string | null;
  } | null;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-2">
      <p className="px-2 pb-1.5 pt-3 text-xs font-semibold text-muted-foreground">
        控制台
      </p>
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md px-2 text-sm",
              active
                ? "bg-kumo-info-tint/45 font-semibold text-foreground"
                : "font-medium text-muted-foreground hover:bg-kumo-fill-hover hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen min-w-0 bg-canvas">
      <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-kumo-hairline bg-sidebar md:flex">
        <div className="flex h-12 items-center px-4">
          <Logo href="/moe/endpoints" />
        </div>
        {nav}
        <div className="mt-auto border-t border-kumo-hairline p-2">
          {user ? <UserNav user={user} variant="sidebar" /> : null}
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-kumo-focus/40"
            aria-label="关闭菜单"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(100vw-3rem,17rem)] max-w-[85vw] flex-col bg-sidebar shadow-kumo">
            <div className="flex h-12 items-center justify-between px-3">
              <Logo href="/moe/endpoints" />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {nav}
            <div className="mt-auto border-t border-kumo-hairline p-2">
              {user ? <UserNav user={user} variant="sidebar" /> : null}
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-kumo-hairline bg-sidebar px-3 sm:gap-3 md:hidden">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
            <span className="sr-only">打开菜单</span>
          </Button>
          <Logo href="/moe/endpoints" className="min-w-0 flex-1" />
          {user ? (
            <div className="shrink-0">
              <UserNav user={user} />
            </div>
          ) : null}
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1120px] flex-1 px-3 py-5 sm:px-4 sm:py-6 md:px-8 md:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
