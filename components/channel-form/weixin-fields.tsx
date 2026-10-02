"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import type { ChannelFormData } from "@/lib/db/schema/channels"
import { useEffect, useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { parseWeixinConfig, stringifyWeixinConfig } from "@/lib/weixin/config"

interface WeixinFieldsProps {
  form: UseFormReturn<ChannelFormData>
  channelId?: string
}

const STATUS_TEXT: Record<string, string> = {
  wait: "等待扫码",
  scaned: "已扫码，请在手机上确认",
  need_verifycode: "请输入验证码",
  verify_code_blocked: "验证码次数过多，请重新扫码",
  expired: "二维码已过期，请重新连接",
  binded_redirect: "该微信已绑定其他应用",
  unknown: "状态未知，请重试",
}

export function WeixinFields({ form, channelId }: WeixinFieldsProps) {
  const { toast } = useToast()
  const [qrSvg, setQrSvg] = useState("")
  const [ticket, setTicket] = useState("")
  const [status, setStatus] = useState("")
  const [verifyCode, setVerifyCode] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [testing, setTesting] = useState(false)
  const pollRef = useRef<number | null>(null)
  const originalChatId = useRef(form.getValues("chatId"))

  const config = parseWeixinConfig(form.watch("config"))
  const connected = Boolean(form.watch("botToken"))
  const hasContext = Boolean(config.contextToken)

  function stopPolling() {
    if (pollRef.current) {
      window.clearTimeout(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => () => stopPolling(), [])

  useEffect(() => {
    const subscription = form.watch((value, info) => {
      if (info.name !== "chatId") return
      if (value.chatId === originalChatId.current) return
      const extra = parseWeixinConfig(form.getValues("config"))
      if (!extra.contextToken) return
      extra.contextToken = ""
      form.setValue("config", stringifyWeixinConfig(extra))
    })
    return () => subscription.unsubscribe()
  }, [form])

  async function pollOnce(nextTicket: string, code?: string) {
    const response = await fetch("/api/weixin/login/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket: nextTicket, verifyCode: code }),
    })
    const data = await response.json() as {
      ok: boolean
      status?: string
      ticket?: string
      error?: string
      account?: { botToken: string; webhook: string; chatId: string; config: string }
    }
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "轮询失败")
    }
    return data
  }

  function schedulePoll(nextTicket: string) {
    stopPolling()
    pollRef.current = window.setTimeout(async () => {
      try {
        const data = await pollOnce(nextTicket)
        if (data.ticket) setTicket(data.ticket)
        if (data.status === "confirmed" && data.account) {
          stopPolling()
          setConnecting(false)
          setQrSvg("")
          setStatus("confirmed")
          form.setValue("botToken", data.account.botToken, { shouldValidate: true })
          form.setValue("webhook", data.account.webhook, { shouldValidate: true })
          form.setValue("chatId", data.account.chatId, { shouldValidate: true })
          form.setValue("config", data.account.config)
          toast({ title: "已连接微信", description: "请保存渠道。收件人需先给这个微信发一条消息，才能开始推送。" })
          return
        }
        if (data.status === "expired" || data.status === "binded_redirect" || data.status === "verify_code_blocked") {
          stopPolling()
          setConnecting(false)
          setStatus(data.status)
          return
        }
        setStatus(data.status || "")
        if (data.status === "need_verifycode") {
          setConnecting(false)
          return
        }
        schedulePoll(data.ticket || nextTicket)
      } catch (error) {
        stopPolling()
        setConnecting(false)
        toast({
          variant: "destructive",
          title: "扫码失败",
          description: error instanceof Error ? error.message : "请稍后重试",
        })
      }
    }, 1600)
  }

  async function startConnect() {
    setConnecting(true)
    setStatus("wait")
    setVerifyCode("")
    try {
      const response = await fetch("/api/weixin/login/start", { method: "POST" })
      const data = await response.json() as { ok: boolean; ticket?: string; qrSvg?: string; error?: string }
      if (!response.ok || !data.ok || !data.ticket || !data.qrSvg) {
        throw new Error(data.error || "无法生成二维码")
      }
      setTicket(data.ticket)
      setQrSvg(data.qrSvg)
      schedulePoll(data.ticket)
    } catch (error) {
      setConnecting(false)
      toast({
        variant: "destructive",
        title: "连接失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    }
  }

  async function submitVerifyCode() {
    if (!ticket || !verifyCode) return
    try {
      const data = await pollOnce(ticket, verifyCode)
      if (data.ticket) setTicket(data.ticket)
      setStatus(data.status || "")
      if (data.status === "confirmed" && data.account) {
        form.setValue("botToken", data.account.botToken, { shouldValidate: true })
        form.setValue("webhook", data.account.webhook, { shouldValidate: true })
        form.setValue("chatId", data.account.chatId, { shouldValidate: true })
        form.setValue("config", data.account.config)
        toast({ title: "已连接微信" })
        return
      }
      if (data.status !== "need_verifycode") {
        schedulePoll(data.ticket || ticket)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    }
  }

  async function refreshSession() {
    if (!channelId) {
      toast({ title: "请先保存渠道", description: "保存后再刷新会话。" })
      return
    }
    setRefreshing(true)
    try {
      const response = await fetch(`/api/weixin/channels/${channelId}/poll`, { method: "POST" })
      const data = await response.json() as { ok: boolean; hasContext?: boolean; config?: string; error?: string }
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "刷新失败")
      }
      if (data.config) form.setValue("config", data.config)
      toast({
        title: data.hasContext ? "会话已就绪" : "还没有捕获到会话",
        description: data.hasContext ? "现在可以发送测试消息。" : "请让收件人先给这个微信发一条消息，稍后再刷新。",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "刷新失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setRefreshing(false)
    }
  }

  async function sendTest() {
    if (!channelId) {
      toast({ title: "请先保存渠道", description: "保存后再发送测试消息。" })
      return
    }
    setTesting(true)
    try {
      const response = await fetch(`/api/channels/${channelId}/test`, { method: "POST" })
      const data = await response.json() as { ok: boolean; error?: string }
      if (!response.ok || !data.ok) {
        if (data.error === "weixin_context_missing") {
          throw new Error("会话尚未就绪。请让收件人先发一条消息，再点「刷新会话」。")
        }
        throw new Error(data.error || "发送失败")
      }
      toast({ title: "测试消息已发送" })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "发送失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <>
      <div className="kumo-callout">
        用微信扫描二维码连接个人微信。连接后，让默认收件人先给这个号发一条消息，再点「刷新会话」。之后创建接口，用 <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">POST /api/push/:id</code> 发纯文本。发送前会自动刷新会话；若部署了 Cron，Worker 也会每 5 分钟维护连接。
      </div>

      {qrSvg && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-kumo-hairline bg-kumo-base p-4">
          <div
            className="aspect-square h-auto w-full max-w-[13rem] text-foreground sm:max-w-[13.5rem]"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="text-sm text-muted-foreground">
            {STATUS_TEXT[status] || (connecting ? "等待扫码" : "请使用微信扫码")}
          </p>
          <p className="text-xs text-muted-foreground">二维码约 5 分钟内有效</p>
        </div>
      )}

      {status === "need_verifycode" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={verifyCode}
            onChange={(event) => setVerifyCode(event.target.value)}
            placeholder="请输入微信验证码"
            inputMode="numeric"
            className="w-full"
          />
          <Button type="button" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={submitVerifyCode}>
            提交验证码
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={startConnect} disabled={connecting}>
          {(connecting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {connected ? "重新扫码连接" : "扫码连接微信"}
        </Button>
        <Button type="button" variant="outline" onClick={refreshSession} disabled={refreshing}>
          {refreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          刷新会话
        </Button>
        <Button type="button" variant="outline" onClick={sendTest} disabled={testing || !hasContext}>
          {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          发送测试消息
        </Button>
      </div>

      <div className="text-sm">
        连接状态：
        <span className="ml-1 font-medium text-foreground">
          {!connected ? "未连接" : hasContext ? "已连接，会话就绪" : "已连接，等待收件人发消息"}
        </span>
      </div>
      {(form.formState.errors.botToken || form.formState.errors.webhook) && (
        <p className="text-sm font-medium text-destructive">请先扫码连接个人微信</p>
      )}

      <FormField
        control={form.control}
        name="chatId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              默认收件人 ID
              <span className="ml-1 text-kumo-text-danger">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="扫码成功后自动填入，可改为实际收件人" className="font-mono" {...field} />
            </FormControl>
            <FormDescription>
              默认是扫码者自己。若要发给别人，把对方的用户 ID 填在这里，并让对方先给这个微信发一条消息。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="botToken"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input type="hidden" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="webhook"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input type="hidden" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input type="hidden" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  )
}
