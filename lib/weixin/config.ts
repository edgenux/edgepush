export type WeixinChannelConfig = {
  botId?: string
  contextToken?: string
  getUpdatesBuf?: string
  scannerUserId?: string
  connectedAt?: number
}

export function parseWeixinConfig(raw?: string | null): WeixinChannelConfig {
  if (!raw) return {}
  try {
    const value = JSON.parse(raw) as Record<string, unknown>
    if (!value || typeof value !== "object" || Array.isArray(value)) return {}
    return {
      botId: typeof value.botId === "string" ? value.botId : undefined,
      contextToken: typeof value.contextToken === "string" ? value.contextToken : undefined,
      getUpdatesBuf: typeof value.getUpdatesBuf === "string" ? value.getUpdatesBuf : undefined,
      scannerUserId: typeof value.scannerUserId === "string" ? value.scannerUserId : undefined,
      connectedAt: typeof value.connectedAt === "number" ? value.connectedAt : undefined,
    }
  } catch {
    return {}
  }
}

export function stringifyWeixinConfig(config: WeixinChannelConfig) {
  return JSON.stringify({
    botId: config.botId || "",
    contextToken: config.contextToken || "",
    getUpdatesBuf: config.getUpdatesBuf || "",
    scannerUserId: config.scannerUserId || "",
    connectedAt: config.connectedAt || Date.now(),
  })
}

export function weixinAccountFromChannel(channel: {
  botToken?: string | null
  webhook?: string | null
  chatId?: string | null
  config?: string | null
}) {
  const extra = parseWeixinConfig(channel.config)
  return {
    botToken: channel.botToken || "",
    baseUrl: channel.webhook || "",
    defaultRecipient: channel.chatId || "",
    contextToken: extra.contextToken,
    getUpdatesBuf: extra.getUpdatesBuf,
    botId: extra.botId,
    scannerUserId: extra.scannerUserId,
  }
}
