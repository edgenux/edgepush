const encoder = new TextEncoder()
const decoder = new TextDecoder()
const TICKET_SECONDS = 5 * 60

type TicketPayload = {
  uid: string
  qrcode: string
  baseUrl: string
  iat: number
  exp: number
}

function toBase64Url(bytes: Uint8Array) {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "")
}

function fromBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error("invalid_encoding")
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - value.length % 4) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function hmacKey(secret: string) {
  const material = await crypto.subtle.digest("SHA-256", encoder.encode(`weixin-qr-ticket-v1:${secret}`))
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
}

function requiredSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 8) throw new Error("auth_secret_not_configured")
  return secret
}

export async function sealWeixinTicket(input: { uid: string; qrcode: string; baseUrl: string; iat?: number; exp?: number }) {
  const now = Math.floor(Date.now() / 1000)
  const payload: TicketPayload = {
    uid: input.uid,
    qrcode: input.qrcode,
    baseUrl: input.baseUrl,
    iat: input.iat ?? now,
    exp: input.exp ?? now + TICKET_SECONDS,
  }
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)))
  const key = await hmacKey(requiredSecret())
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body))
  return `${body}.${toBase64Url(new Uint8Array(signature))}`
}

export async function openWeixinTicket(token: string, uid: string) {
  if (typeof token !== "string" || token.length > 12_000) return null
  const parts = token.split(".")
  if (parts.length !== 2) return null
  try {
    const key = await hmacKey(requiredSecret())
    const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(parts[1]), encoder.encode(parts[0]))
    if (!valid) return null
    const payload = JSON.parse(decoder.decode(fromBase64Url(parts[0]))) as TicketPayload
    if (!payload || payload.uid !== uid || payload.exp <= Math.floor(Date.now() / 1000)) return null
    if (typeof payload.qrcode !== "string" || typeof payload.baseUrl !== "string") return null
    return payload
  } catch {
    return null
  }
}
