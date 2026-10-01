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
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          {nav}
        </div>

        <div className="flex items-center gap-3">
          {variant === "home" && (
            <Link
              href="https://github.com/beilunyang/moepush"
              target="_blank"
              rel="noreferrer"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              GitHub
            </Link>
          )}

          {user ? (
            <UserNav user={user} />
          ) : (
            variant === "home" && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">登录</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">开始使用</Link>
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
