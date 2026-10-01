import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center px-6">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 font-cal text-3xl font-semibold tracking-tight">找不到这个页面</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          链接可能写错了，或者这个页面已经被移走。
        </p>
        <Button className="mt-6" asChild>
          <Link href="/">回到首页</Link>
        </Button>
      </main>
    </div>
  );
}
