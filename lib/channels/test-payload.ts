import { CHANNEL_TYPES, type ChannelType } from "./index"

export function formatChannelTestText(channelName: string): string {
  const time = new Date().toLocaleString("zh-CN", { hour12: false })
  return `EdgePush 渠道连通性测试\n渠道：${channelName}\n时间：${time}`
}

export function buildChannelTestMessage(
  type: ChannelType,
  channelName: string,
): Record<string, unknown> {
  const text = formatChannelTestText(channelName)

  switch (type) {
    case CHANNEL_TYPES.DINGTALK:
      return { msgtype: "text", text: { content: text } }
    case CHANNEL_TYPES.WECOM:
      return { msgtype: "text", text: { content: text } }
    case CHANNEL_TYPES.WECOM_APP:
      return { msgtype: "text", text: { content: text }, touser: "@all" }
    case CHANNEL_TYPES.TELEGRAM:
      return { text, parse_mode: "HTML", disable_notification: false }
    case CHANNEL_TYPES.FEISHU:
      return { msg_type: "text", content: { text } }
    case CHANNEL_TYPES.DISCORD:
      return { content: text }
    case CHANNEL_TYPES.BARK:
      return { title: "EdgePush 测试", body: text }
    case CHANNEL_TYPES.WEBHOOK:
      return {
        method: "POST",
        body: JSON.stringify({
          source: "edgepush",
          event: "channel_test",
          text,
        }),
      }
    case CHANNEL_TYPES.WEIXIN:
      return { msgtype: "text", text }
    default:
      throw new Error(`unsupported_channel_type:${type}`)
  }
}
