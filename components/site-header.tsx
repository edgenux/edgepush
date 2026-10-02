import Link from "next/link";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import { User } from "next-auth";
import { Logo } from "@/components/brand/logo";

interface SiteHeaderProps {
  user?: User | null;
  variant?: "home" | "dashboard";
  nav?: React.ReactNode;
}

export function SiteHeader({ user, variant = "home", nav }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-kumo-hairline bg-kumo-base">
      <div className="mx-auto flex h-12 w-full min-w-0 max-w-[1120px] items-center justify-between gap-2 px-3 sm:px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Logo className="min-w-0 shrink" />
          {nav}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {variant === "home" && (
            <Link
              href="https://github.com/beilunyang/moepush"
              target="_blank"
              rel="noreferrer"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline-flex"
            >
              GitHub
            </Link>
          )}

          {user ? (
            <UserNav user={user} />
          ) : (
            variant === "home" && (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">登录</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">
                    <span className="sm:hidden">注册</span>
                    <span className="hidden sm:inline">开始使用</span>
                  </Link>
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
