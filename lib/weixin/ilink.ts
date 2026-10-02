const LOGIN_BASE_URL = "https://ilinkai.weixin.qq.com/"
const QR_TIMEOUT_MS = 20_000
const UPDATES_TIMEOUT_MS = 45_000
const SEND_TIMEOUT_MS = 15_000
const MAX_RESPONSE_BYTES = 32 * 1024

export type WeixinRuntimeEnv = {
  WEIXIN_CHANNEL_VERSION?: string
  WEIXIN_APP_ID?: string
}

export type WeixinAccount = {
  botToken: string
  baseUrl: string
  defaultRecipient: string
  contextToken?: string
  getUpdatesBuf?: string
}

export class WeixinSendError extends Error {
  upstreamStatus?: number
  upstreamRet?: number
  upstreamErrcode?: number

  constructor(message: string, extras?: { upstreamStatus?: number; upstreamRet?: number; upstreamErrcode?: number }) {
    super(message)
    this.name = "WeixinSendError"
    this.upstreamStatus = extras?.upstreamStatus
    this.upstreamRet = extras?.upstreamRet
    this.upstreamErrcode = extras?.upstreamErrcode
  }
}

function encodedClientVersion(version: string) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(version)
  if (!match) throw new Error("invalid_channel_version")
  const [major, minor, patch] = match.slice(1).map(Number)
  return String(((major & 0xff) << 16) | ((minor & 0xff) << 8) | (patch & 0xff))
}

function channelVersion(env: WeixinRuntimeEnv) {
  return env.WEIXIN_CHANNEL_VERSION || "2.4.9"
}

function commonHeaders(env: WeixinRuntimeEnv) {
  return {
    "iLink-App-Id": env.WEIXIN_APP_ID || "bot",
    "iLink-App-ClientVersion": encodedClientVersion(channelVersion(env)),
  }
}

function requestHeaders(env: WeixinRuntimeEnv, { token, json = false }: { token?: string; json?: boolean } = {}) {
  const randomUin = crypto.getRandomValues(new Uint32Array(1))[0]
  const headers: Record<string, string> = {
    ...commonHeaders(env),
    AuthorizationType: "ilink_bot_token",
    "X-WECHAT-UIN": btoa(String(randomUin)),
  }
  if (json) headers["Content-Type"] = "application/json"
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function readJson(response: Response, maxBytes = MAX_RESPONSE_BYTES) {
  const contentLength = Number(response.headers.get("Content-Length") || 0)
  if (contentLength > maxBytes) throw new Error("weixin_response_too_large")
  const raw = await response.text()
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new Error("weixin_response_too_large")
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    throw new Error("invalid_weixin_response")
  }
}

function baseInfo(env: WeixinRuntimeEnv) {
  return {
    channel_version: channelVersion(env),
    bot_agent: "OpenClaw",
  }
}

async function fetchWithTimeout(url: string | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    const name = error instanceof Error ? error.name : ""
    if (name === "AbortError" || name === "TimeoutError") {
      throw new Error("weixin_upstream_timeout")
    }
    throw new Error("weixin_upstream_unreachable")
  } finally {
    clearTimeout(timeout)
  }
}

export function normalizeBaseUrl(value: string) {
  if (typeof value !== "string" || value.length > 512) throw new Error("invalid_weixin_base_url")
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error("invalid_weixin_base_url")
  }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("invalid_weixin_base_url")
  }
  if (url.pathname !== "/" && url.pathname !== "") throw new Error("invalid_weixin_base_url")
  return `${url.origin}/`
}

function normalizeRedirectHost(value: string) {
  if (typeof value !== "string" || value.length > 253 || !/^[A-Za-z0-9.-]+$/u.test(value)) {
    throw new Error("invalid_weixin_redirect_host")
  }
  const url = new URL(`https://${value}`)
  if (url.hostname !== value.toLowerCase() || !url.hostname.includes(".")) {
    throw new Error("invalid_weixin_redirect_host")
  }
  return `${url.origin}/`
}

export function getWeixinRuntimeEnv(): WeixinRuntimeEnv {
  return {
    WEIXIN_CHANNEL_VERSION: process.env.WEIXIN_CHANNEL_VERSION,
    WEIXIN_APP_ID: process.env.WEIXIN_APP_ID,
  }
}

export async function startQrLogin(existingTokens: string[], env: WeixinRuntimeEnv) {
  const url = new URL("ilink/bot/get_bot_qrcode?bot_type=3", LOGIN_BASE_URL)
  let response: Response
  try {
    response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: requestHeaders(env, { json: true }),
        body: JSON.stringify({ local_token_list: existingTokens.slice(0, 10) }),
      },
      15_000,
    )
  } catch (error) {
    if (error instanceof Error && (error.message === "weixin_upstream_timeout" || error.message === "weixin_upstream_unreachable")) {
      throw error
    }
    throw new Error("weixin_qr_start_failed")
  }
  if (!response.ok) throw new Error(`weixin_qr_upstream_http_${response.status}`)
  const result = await readJson(response, 16 * 1024)
  if (typeof result.qrcode !== "string" || result.qrcode.length > 4096) {
    throw new Error("invalid_weixin_qr_response")
  }
  if (typeof result.qrcode_img_content !== "string" || result.qrcode_img_content.length > 8192) {
    throw new Error("invalid_weixin_qr_response")
  }
  return {
    qrcode: result.qrcode,
    qrcodeImgContent: result.qrcode_img_content,
    baseUrl: LOGIN_BASE_URL,
  }
}

export type WeixinQrPollResult =
  | { status: "redirect"; baseUrl: string }
  | {
      status: "confirmed"
      account: {
        botToken: string
        botId: string
        baseUrl: string
        scannerUserId: string
      }
    }
  | { status: "wait" | "scaned" | "need_verifycode" | "verify_code_blocked" | "expired" | "binded_redirect" | "unknown" }

export async function pollQrLogin(
  { qrcode, baseUrl, verifyCode }: { qrcode: string; baseUrl: string; verifyCode?: string },
  env: WeixinRuntimeEnv,
): Promise<WeixinQrPollResult> {
  if (!qrcode || qrcode.length > 4096) throw new Error("invalid_qr_ticket")
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  if (verifyCode !== undefined && !/^\d{1,12}$/u.test(verifyCode)) {
    throw new Error("invalid_verify_code")
  }
  const url = new URL("ilink/bot/get_qrcode_status", normalizedBaseUrl)
  url.searchParams.set("qrcode", qrcode)
  if (verifyCode) url.searchParams.set("verify_code", verifyCode)
  const response = await fetchWithTimeout(
    url,
    { method: "GET", headers: commonHeaders(env) },
    QR_TIMEOUT_MS,
  )
  if (!response.ok) throw new Error("weixin_qr_poll_failed")
  const result = await readJson(response, 16 * 1024)
  const status = result.status
  if (status === "scaned_but_redirect") {
    return {
      status: "redirect" as const,
      baseUrl: typeof result.redirect_host === "string"
        ? normalizeRedirectHost(result.redirect_host)
        : normalizedBaseUrl,
    }
  }
  if (status === "confirmed") {
    if (typeof result.bot_token !== "string" || result.bot_token.length > 4096) {
      throw new Error("invalid_weixin_login_response")
    }
    if (typeof result.ilink_bot_id !== "string" || result.ilink_bot_id.length > 512) {
      throw new Error("invalid_weixin_login_response")
    }
    if (typeof result.ilink_user_id !== "string" || result.ilink_user_id.length > 512) {
      throw new Error("invalid_weixin_login_response")
    }
    return {
      status: "confirmed" as const,
      account: {
        botToken: result.bot_token,
        botId: result.ilink_bot_id,
        baseUrl: normalizeBaseUrl(typeof result.baseurl === "string" ? result.baseurl : normalizedBaseUrl),
        scannerUserId: result.ilink_user_id,
      },
    }
  }
  const supported = ["wait", "scaned", "need_verifycode", "verify_code_blocked", "expired", "binded_redirect"] as const
  const next = String(status)
  if ((supported as readonly string[]).includes(next)) {
    return { status: next as typeof supported[number] }
  }
  return { status: "unknown" }
}

export async function pollUpdates(account: WeixinAccount, env: WeixinRuntimeEnv) {
  const baseUrl = normalizeBaseUrl(account.baseUrl)
  if (!account.botToken) throw new Error("account_send_not_configured")
  const endpoint = new URL("ilink/bot/getupdates", baseUrl)
  const response = await fetchWithTimeout(
    endpoint,
    {
      method: "POST",
      headers: requestHeaders(env, { token: account.botToken, json: true }),
      body: JSON.stringify({
        get_updates_buf: account.getUpdatesBuf || "",
        base_info: baseInfo(env),
      }),
    },
    UPDATES_TIMEOUT_MS,
  )
  if (!response.ok) throw new Error("weixin_updates_failed")
  const result = await readJson(response, 256 * 1024)
  if (result.ret !== undefined && result.ret !== 0) throw new Error("weixin_updates_failed")
  if (result.msgs !== undefined && !Array.isArray(result.msgs)) throw new Error("invalid_weixin_updates_response")
  if (result.get_updates_buf !== undefined && (typeof result.get_updates_buf !== "string" || result.get_updates_buf.length > 16_384)) {
    throw new Error("invalid_weixin_updates_response")
  }
  return {
    getUpdatesBuf: typeof result.get_updates_buf === "string" ? result.get_updates_buf : account.getUpdatesBuf || "",
    messages: ((result.msgs as Array<Record<string, unknown>>) || []).slice(-200),
  }
}

export async function sendText(account: WeixinAccount, text: string, env: WeixinRuntimeEnv) {
  const baseUrl = normalizeBaseUrl(account.baseUrl)
  if (!account.botToken || !account.defaultRecipient) {
    throw new Error("account_send_not_configured")
  }
  if (!account.contextToken) {
    throw new Error("weixin_context_missing")
  }
  const endpoint = new URL("ilink/bot/sendmessage", baseUrl)
  const response = await fetchWithTimeout(
    endpoint,
    {
      method: "POST",
      headers: requestHeaders(env, { token: account.botToken, json: true }),
      body: JSON.stringify({
        msg: {
          from_user_id: "",
          to_user_id: account.defaultRecipient,
          client_id: crypto.randomUUID(),
          message_type: 2,
          message_state: 2,
          context_token: account.contextToken,
          item_list: [{ type: 1, text_item: { text } }],
        },
        base_info: baseInfo(env),
      }),
    },
    SEND_TIMEOUT_MS,
  )
  const result = await readJson(response)
  if (!response.ok || (result.ret !== undefined && result.ret !== 0)) {
    throw new WeixinSendError("weixin_send_failed", {
      upstreamStatus: response.status,
      upstreamRet: Number.isInteger(result.ret) ? Number(result.ret) : undefined,
      upstreamErrcode: Number.isInteger(result.errcode) ? Number(result.errcode) : undefined,
    })
  }
  return { messageId: typeof result.message_id === "string" ? result.message_id : null }
}
