import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "登录 - MoePush",
  description: "登录到 MoePush",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="欢迎回来"
      description="使用用户名密码或 GitHub 登录。"
      footer={
        <p>
          还没有账号？{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            注册
          </Link>
        </p>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
