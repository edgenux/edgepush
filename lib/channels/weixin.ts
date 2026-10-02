import { BaseChannel, ChannelConfig, SendMessageOptions } from "./base"
import { parseWeixinConfig } from "@/lib/weixin/config"
import { getWeixinRuntimeEnv, sendText, WeixinSendError } from "@/lib/weixin/ilink"

interface WeixinMessage {
  msgtype?: "text"
  text?: string
  content?: string
}

export class WeixinChannel extends BaseChannel {
  readonly config: ChannelConfig = {
    type: "weixin",
    label: "个人微信",
    templates: [
      {
        type: "text",
        name: "文本消息",
        description: "通过已连接的个人微信发送纯文本通知，单条最多 4000 字",
        fields: [
          {
            key: "text",
            description: "消息内容",
            required: true,
            component: "textarea",
          },
          {
            key: "msgtype",
            component: "hidden",
            defaultValue: "text",
          },
        ],
      },
    ],
  }

  async sendMessage(message: WeixinMessage, options: SendMessageOptions): Promise<Response> {
    const text = (message.text || message.content || "").trim()
    if (!text) {
      throw new Error("消息内容不能为空")
    }
    if (text.length > 4000) {
      throw new Error("消息内容不能超过 4000 个字符")
    }

    const extra = typeof options.config === "string"
      ? parseWeixinConfig(options.config)
      : (options.config || {})
    const botToken = options.botToken
    const baseUrl = options.webhook
    const defaultRecipient = options.chatId

    if (!botToken || !baseUrl || !defaultRecipient) {
      throw new Error("请先扫码连接个人微信，并填写默认收件人")
    }

    try {
      const result = await sendText(
        {
          botToken,
          baseUrl,
          defaultRecipient,
          contextToken: extra.contextToken,
        },
        text,
        getWeixinRuntimeEnv(),
      )
      return new Response(JSON.stringify({ message: "推送成功", messageId: result.messageId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      if (error instanceof Error && error.message === "weixin_context_missing") {
        throw new Error("会话尚未就绪。请让收件人先给这个微信发一条消息，然后点击「刷新会话」，或等待最多 5 分钟。")
      }
      if (error instanceof WeixinSendError && error.upstreamRet === -2) {
        throw new Error("微信会话已失效。请让收件人再发一条消息，然后点击「刷新会话」。")
      }
      if (error instanceof Error) {
        throw new Error(`个人微信推送失败: ${error.message}`)
      }
      throw error
    }
  }
}
