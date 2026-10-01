import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Zap, Shield, Heart } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic"

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader user={session?.user} variant="home" />

      <main className="flex-1">
        <section className="border-b">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 md:px-6 md:py-28">
            <p className="text-sm font-medium text-muted-foreground">
              <Link
                href="https://github.com/beilunyang/moepush"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                开源 · GitHub
              </Link>
            </p>
            <h1 className="max-w-3xl font-cal text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              把消息送到该去的地方
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              MoePush 帮你把告警、通知和自定义消息推到钉钉、企业微信、个人微信、Telegram、Discord 等渠道。接口简单，自己托管。
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/moe">
                  进入控制台
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">创建账号</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto grid max-w-6xl gap-px bg-border px-0 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MessageSquare,
                title: "多渠道",
                description: "钉钉、企业微信、个人微信、飞书、Telegram、Discord、Bark、自定义 Webhook。",
              },
              {
                icon: Zap,
                title: "接口即推送",
                description: "为每个渠道生成独立接口，配好模板就能发 HTTP 请求。",
              },
              {
                icon: Shield,
                title: "自己掌控",
                description: "跑在 Cloudflare Workers 上，密钥和数据都在你的账号里。",
              },
              {
                icon: Heart,
                title: "开源免费",
                description: "代码公开，基础能力免费使用，欢迎一起改。",
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-background p-8">
                <feature.icon className="mb-4 h-5 w-5 text-foreground" />
                <h2 className="font-cal text-lg font-semibold tracking-tight">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
            <h2 className="font-cal text-3xl font-semibold tracking-tight">三步开始</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              不需要再拼一套机器人网关。
            </p>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "添加渠道",
                  description: "填入 Webhook、Bot Token，或扫码连接个人微信。",
                },
                {
                  step: "02",
                  title: "创建接口",
                  description: "选择渠道、配好消息模板，得到一个推送 URL。",
                },
                {
                  step: "03",
                  title: "发送请求",
                  description: "用 HTTP 调用接口，消息就会出现在对应聊天里。",
                },
              ].map((step) => (
                <li key={step.step} className="rounded-md border bg-card p-6">
                  <p className="text-xs font-medium text-muted-foreground">{step.step}</p>
                  <h3 className="mt-3 font-cal text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:px-6">
          <p>MoePush</p>
          <p>
            Built by{" "}
            <a
              href="https://github.com/beilunyang"
              target="_blank"
              rel="noreferrer"
              className="text-foreground hover:underline"
            >
              BeilunYang
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
