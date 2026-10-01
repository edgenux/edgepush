import QRCode from "qrcode-svg"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { channels } from "@/lib/db/schema/channels"
import { CHANNEL_TYPES } from "@/lib/channels"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getWeixinRuntimeEnv, startQrLogin } from "@/lib/weixin/ilink"
import { sealWeixinTicket } from "@/lib/weixin/tickets"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }

    const db = getDb()
    const existing = await db.query.channels.findMany({
      where: and(
        eq(channels.userId, session.user.id),
        eq(channels.type, CHANNEL_TYPES.WEIXIN),
      ),
    })
    const tokens = existing
      .map((channel) => channel.botToken)
      .filter((token): token is string => Boolean(token))
      .slice(-10)

    const qr = await startQrLogin(tokens, getWeixinRuntimeEnv())
    const ticket = await sealWeixinTicket({
      uid: session.user.id,
      qrcode: qr.qrcode,
      baseUrl: qr.baseUrl,
    })
    const qrSvg = new QRCode({
      content: qr.qrcodeImgContent,
      padding: 4,
      width: 240,
      height: 240,
      color: "#111827",
      background: "#ffffff",
      ecl: "M",
      join: true,
      container: "svg-viewbox",
      xmlDeclaration: false,
    }).svg()

    if (qrSvg.length > 64 * 1024) {
      return NextResponse.json({ ok: false, error: "qr_render_failed" }, { status: 502 })
    }

    return NextResponse.json({
      ok: true,
      ticket,
      qrSvg,
      expiresAt: Date.now() + 5 * 60_000,
    })
  } catch (error) {
    console.error("[WEIXIN_LOGIN_START]", error)
    const code = error instanceof Error ? error.message : "weixin_qr_start_failed"
    return NextResponse.json({ ok: false, error: code }, { status: 502 })
  }
}
