import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Zap, Shield, Heart } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic"

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SiteHeader user={session?.user} variant="home" />

      <main className="flex-1">
        <section>
          <div className="mx-auto flex max-w-[1120px] flex-col items-start gap-4 px-3 py-12 sm:gap-5 sm:px-4 sm:py-16 md:px-6 md:py-24">
            <p className="inline-flex items-center rounded-full border border-kumo-hairline bg-kumo-base px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Link
                href="https://github.com/edgenux/edgepush"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                开源 · 运行在 Cloudflare Workers
              </Link>
            </p>
            <h1 className="max-w-3xl text-[1.75rem] font-semibold leading-tight text-foreground sm:text-4xl md:text-[40px] md:leading-[1.15]">
              把消息送到该去的地方
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              EdgePush 将告警、通知与业务消息统一推送到钉钉、企业微信、个人微信、Telegram、Discord 等渠道，基于 Cloudflare Workers 部署。
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/admin">
                  进入控制台
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/register">创建账号</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y border-kumo-hairline">
          <div className="mx-auto grid max-w-[1120px] gap-px bg-kumo-hairline md:grid-cols-2 lg:grid-cols-4">
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
              <div key={feature.title} className="bg-kumo-base p-5 sm:p-6">
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-md bg-kumo-recessed text-foreground">
                  <feature.icon className="h-4 w-4" />
                </div>
                <h2 className="text-base font-semibold">{feature.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-[1120px] px-3 py-12 sm:px-4 sm:py-16 md:px-6 md:py-20">
            <h2 className="text-2xl font-semibold">三步开始</h2>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              不需要再拼一套机器人网关。
            </p>
            <ol className="mt-8 grid gap-3 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "添加渠道",
                  description: "填入 Webhook、Bot Token，或扫码连接个人微信。",
                },
                {
                  step: "2",
                  title: "创建接口",
                  description: "选择渠道、配好消息模板，得到一个推送 URL。",
                },
                {
                  step: "3",
                  title: "发送请求",
                  description: "用 HTTP 调用接口，消息就会出现在对应聊天里。",
                },
              ].map((step) => (
                <li key={step.step} className="rounded-lg border border-kumo-hairline bg-kumo-base p-5">
                  <p className="flex h-6 w-6 items-center justify-center rounded-md bg-kumo-info-tint/45 text-xs font-semibold text-kumo-link">
                    {step.step}
                  </p>
                  <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-kumo-hairline bg-kumo-base">
        <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:px-6">
          <p>EdgePush</p>
          <p>
            <a
              href="https://github.com/edgenux/edgepush"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-kumo-link hover:underline"
            >
              EdgeNux
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
