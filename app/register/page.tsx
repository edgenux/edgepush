import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { GitHubButton } from "@/components/auth/github-button";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "注册 - MoePush",
  description: "创建新账号",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="创建账号"
      description="几秒钟就能开始推送消息。"
      footer={
        <p>
          已有账号？{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            登录
          </Link>
        </p>
      }
    >
      <div className="grid gap-6">
        <RegisterForm />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">或者</span>
          </div>
        </div>
        <GitHubButton />
      </div>
    </AuthShell>
  );
}
