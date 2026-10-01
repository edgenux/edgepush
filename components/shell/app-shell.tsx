"use client";

import { useState } from "react";
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

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
    <div className="flex min-h-screen bg-canvas">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center px-4">
          <Logo href="/moe/endpoints" />
        </div>
        {nav}
        <div className="mt-auto border-t p-3">
          {user ? <UserNav user={user} variant="sidebar" /> : null}
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="关闭菜单"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-64 flex-col bg-sidebar shadow-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <Logo href="/moe/endpoints" />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {nav}
            <div className="mt-auto border-t p-3">
              {user ? <UserNav user={user} variant="sidebar" /> : null}
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-sidebar px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
            <span className="sr-only">打开菜单</span>
          </Button>
          <Logo href="/moe/endpoints" />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
