import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { channels } from "@/lib/db/schema/channels"
import { CHANNEL_TYPES } from "@/lib/channels"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { parseWeixinConfig, stringifyWeixinConfig, weixinAccountFromChannel } from "@/lib/weixin/config"
import { getWeixinRuntimeEnv, sendText, WeixinSendError } from "@/lib/weixin/ilink"

const TEST_MESSAGE_TEXT = "你好！这里是 MoePush 个人微信通知。"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }

    const { channelId } = await params
    const db = getDb()
    const channel = await db.query.channels.findFirst({
      where: and(
        eq(channels.id, channelId),
        eq(channels.userId, session.user.id),
        eq(channels.type, CHANNEL_TYPES.WEIXIN),
      ),
    })
    if (!channel) {
      return NextResponse.json({ ok: false, error: "channel_not_found" }, { status: 404 })
    }

    const account = weixinAccountFromChannel(channel)
    try {
      const result = await sendText(account, TEST_MESSAGE_TEXT, getWeixinRuntimeEnv())
      return NextResponse.json({ ok: true, messageId: result.messageId })
    } catch (error) {
      if (error instanceof WeixinSendError && error.upstreamRet === -2) {
        const extra = parseWeixinConfig(channel.config)
        extra.contextToken = ""
        await db.update(channels)
          .set({ config: stringifyWeixinConfig(extra) })
          .where(eq(channels.id, channel.id))
        return NextResponse.json({ ok: false, error: "weixin_context_missing" }, { status: 409 })
      }
      throw error
    }
  } catch (error) {
    console.error("[WEIXIN_TEST]", error)
    const code = error instanceof Error ? error.message : "weixin_send_failed"
    const status = code === "weixin_context_missing" ? 409 : 502
    return NextResponse.json({ ok: false, error: code }, { status })
  }
}
