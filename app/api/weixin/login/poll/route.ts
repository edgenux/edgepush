import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getWeixinRuntimeEnv, pollQrLogin } from "@/lib/weixin/ilink"
import { openWeixinTicket, sealWeixinTicket } from "@/lib/weixin/tickets"
import { stringifyWeixinConfig } from "@/lib/weixin/config"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }

    const input = await request.json() as { ticket?: string; verifyCode?: string }
    const ticket = await openWeixinTicket(input.ticket || "", session.user.id)
    if (!ticket) {
      return NextResponse.json({ ok: false, error: "invalid_or_expired_qr_ticket" }, { status: 401 })
    }
    if (input.verifyCode !== undefined && !/^\d{1,12}$/u.test(input.verifyCode)) {
      return NextResponse.json({ ok: false, error: "invalid_verify_code" }, { status: 400 })
    }

    const result = await pollQrLogin(
      { qrcode: ticket.qrcode, baseUrl: ticket.baseUrl, verifyCode: input.verifyCode },
      getWeixinRuntimeEnv(),
    )

    if (result.status === "redirect") {
      const nextTicket = await sealWeixinTicket({
        uid: session.user.id,
        qrcode: ticket.qrcode,
        baseUrl: result.baseUrl,
        iat: ticket.iat,
        exp: ticket.exp,
      })
      return NextResponse.json({ ok: true, status: "redirect", ticket: nextTicket })
    }

    if (result.status !== "confirmed") {
      return NextResponse.json({ ok: true, status: result.status })
    }

    const account = result.account
    return NextResponse.json({
      ok: true,
      status: "confirmed",
      account: {
        botToken: account.botToken,
        webhook: account.baseUrl,
        chatId: account.scannerUserId,
        config: stringifyWeixinConfig({
          botId: account.botId,
          scannerUserId: account.scannerUserId,
          connectedAt: Date.now(),
        }),
      },
    })
  } catch (error) {
    console.error("[WEIXIN_LOGIN_POLL]", error)
    const code = error instanceof Error ? error.message : "weixin_qr_poll_failed"
    return NextResponse.json({ ok: false, error: code }, { status: 502 })
  }
}
