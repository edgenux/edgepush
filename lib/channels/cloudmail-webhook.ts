import type { MessageTemplate } from "./base"
import type { ChannelType } from "./index"

/** Cloud Mail 收到新邮件后 POST 到 EdgePush 的 JSON 字段（mail-worker webhook-service） */
export const CLOUDMAIL_WEBHOOK_BODY_FIELDS = [
  "emailId",
  "sendEmail",
  "sendName",
  "toEmail",
  "toName",
  "subject",
  "text",
  "content",
  "code",
  "createTime",
] as const

const CLOUDMAIL_TEMPLATE_META = {
  type: "cloudmail",
  name: "Cloud Mail 新邮件",
  description:
    "适配 Cloud Mail Webhook：POST JSON 含 subject、sendEmail、sendName、toEmail、text、code 等字段，占位符使用 ${body.xxx}",
} as const

const PLAIN_BODY = [
  "【新邮件】${body.subject}",
  "发件：${body.sendName} <${body.sendEmail}>",
  "收件：${body.toName} ${body.toEmail}",
  "时间：${body.createTime}",
  "",
  "${truncate(body.text, 1200)}",
  "",
  "验证码：${body.code}",
].join("\n")

const TELEGRAM_HTML = [
  "<b>新邮件</b>",
  "<b>主题</b> ${body.subject}",
  "<b>发件</b> ${body.sendName} &lt;${body.sendEmail}&gt;",
  "<b>收件</b> ${body.toEmail}",
  "<b>时间</b> ${body.createTime}",
  "",
  "${truncate(body.text, 1200)}",
  "",
  "<b>验证码</b> ${body.code}",
].join("\n")

const WEBHOOK_JSON_BODY = JSON.stringify(
  {
    source: "cloudmail",
    emailId: "${body.emailId}",
    subject: "${body.subject}",
    from: "${body.sendEmail}",
    fromName: "${body.sendName}",
    to: "${body.toEmail}",
    text: "${body.text}",
    code: "${body.code}",
    receivedAt: "${body.createTime}",
  },
  null,
  2,
)

const TEMPLATES_BY_CHANNEL: Partial<Record<ChannelType, MessageTemplate>> = {
  dingtalk: {
    ...CLOUDMAIL_TEMPLATE_META,
    fields: [
      {
        key: "text.content",
        description: "消息内容",
        required: true,
        component: "textarea",
        defaultValue: PLAIN_BODY,
      },
      { key: "msgtype", component: "hidden", defaultValue: "text" },
    ],
  },
  wecom: {
    ...CLOUDMAIL_TEMPLATE_META,
    fields: [
      {
        key: "text.content",
        description: "消息内容",
        required: true,
        component: "textarea",
        defaultValue: PLAIN_BODY,
      },
      { key: "msgtype", component: "hidden", defaultValue: "text" },
    ],
  },
  wecom_app: {
    ...CLOUDMAIL_TEMPLATE_META,
    fields: [
      {
        key: "text.content",
        description: "消息内容",
        required: true,
        component: "textarea",
        defaultValue: PLAIN_BODY,
      },
      { key: "touser", component: "hidden", defaultValue: "@all" },
      { key: "msgtype", component: "hidden", defaultValue: "text" },
    ],
  },
  telegram: {
    ...CLOUDMAIL_TEMPLATE_META,
    fields: [
      {
        key: "text",
        description: "HTML 内容",
        required: true,
        component: "textarea",
        defaultValue: TELEGRAM_HTML,
      },
      { key: "parse_mode", component: "hidden", defaultValue: "HTML" },
    ],
  },
  feishu: {
    ...CLOUDMAIL_TEMPLATE_META,
    fields: [
      {
        key: "content.text",
        description: "文本内容",
        required: true,
        component: "textarea",
        defaultValue: PLAIN_BODY,
      },
      { key: "msg_type", component: "hidden", defaultValue: "text" },
    ],
  },
  discord: {
    ...CLOUDMAIL_TEMPLATE_META,
    fields: [
      {
        key: "content",
        description: "消息内容",
        required: true,
        component: "textarea",
        defaultValue: PLAIN_BODY,
      },
    ],
  },
  bark: {
    ...CLOUDMAIL_TEMPLATE_META,
    fields: [
      {
        key: "title",
        description: "标题",
        defaultValue: "新邮件：${body.subject}",
      },
      {
        key: "body",
        description: "正文",
        required: true,
        component: "textarea",
        defaultValue: "${body.sendName} → ${body.toEmail}\n${truncate(body.text, 500)}",
      },
      {
        key: "group",
        description: "分组",
        defaultValue: "CloudMail",
      },
    ],
  },
  weixin: {
    ...CLOUDMAIL_TEMPLATE_META,
    fields: [
      {
        key: "text",
        description: "消息内容",
        required: true,
        component: "textarea",
        defaultValue: PLAIN_BODY.replace("${truncate(body.text, 1200)}", "${truncate(body.text, 800)}"),
      },
      { key: "msgtype", component: "hidden", defaultValue: "text" },
    ],
  },
  webhook: {
    ...CLOUDMAIL_TEMPLATE_META,
    fields: [
      { key: "method", component: "hidden", defaultValue: "POST" },
      {
        key: "body",
        description: "请求体 JSON",
        required: true,
        component: "textarea",
        defaultValue: WEBHOOK_JSON_BODY,
      },
    ],
  },
}

export function getCloudMailWebhookTemplate(
  channelType: ChannelType,
): MessageTemplate | undefined {
  return TEMPLATES_BY_CHANNEL[channelType]
}

export function appendCloudMailTemplates(
  channelType: ChannelType,
  templates: MessageTemplate[],
): MessageTemplate[] {
  const cloudmail = getCloudMailWebhookTemplate(channelType)
  if (!cloudmail) {
    return templates
  }
  if (templates.some((t) => t.type === cloudmail.type)) {
    return templates
  }
  return [...templates, cloudmail]
}

/** 接口示例 / 测试请求体样例 */
export const CLOUDMAIL_WEBHOOK_EXAMPLE_BODY: Record<string, string> = {
  emailId: "cm-example-001",
  sendEmail: "sender@example.com",
  sendName: "发件人昵称",
  toEmail: "you@yourdomain.com",
  toName: "",
  subject: "Cloud Mail 测试邮件",
  text: "这是纯文本正文，EdgePush 会按模板推送到渠道。",
  content: "<p>HTML 正文</p>",
  code: "123456",
  createTime: "2026-10-02 12:00:00",
}
