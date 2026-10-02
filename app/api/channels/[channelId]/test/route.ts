import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { channels } from "@/lib/db/schema/channels"
import {
  CHANNEL_TYPES,
  sendChannelMessage,
  type ChannelType,
} from "@/lib/channels"
import { buildChannelTestMessage } from "@/lib/channels/test-payload"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { clearWeixinChannelContext, syncWeixinChannelRecord } from "@/lib/weixin/poll"

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
    const db = await getDb()
    const channel = await db.query.channels.findFirst({
      where: and(
        eq(channels.id, channelId),
        eq(channels.userId, session.user.id),
      ),
    })

    if (!channel) {
      return NextResponse.json({ ok: false, error: "channel_not_found" }, { status: 404 })
    }

    if (channel.status !== "active") {
      return NextResponse.json({ ok: false, error: "channel_inactive" }, { status: 403 })
    }

    const type = channel.type as ChannelType
    const message = buildChannelTestMessage(type, channel.name)
    let channelConfig = channel.config

    if (type === CHANNEL_TYPES.WEIXIN) {
      try {
        const synced = await syncWeixinChannelRecord(db, channel)
        channelConfig = synced.config
      } catch (error) {
        console.warn("[CHANNEL_TEST] weixin pre-send poll failed", error)
      }
    }

    try {
      await sendChannelMessage(type, message, {
        webhook: channel.webhook,
        secret: channel.secret,
        corpId: channel.corpId,
        agentId: channel.agentId,
        botToken: channel.botToken,
        chatId: channel.chatId,
        config: channelConfig,
      })
    } catch (error) {
      if (
        type === CHANNEL_TYPES.WEIXIN &&
        error instanceof Error &&
        (error.message.includes("会话已失效") ||
          error.message.includes("会话尚未就绪") ||
          error.message === "weixin_context_missing")
      ) {
        await clearWeixinChannelContext(db, { ...channel, config: channelConfig })
        return NextResponse.json(
          {
            ok: false,
            error: "weixin_context_missing",
            message: "个人微信会话尚未就绪，请让收件人先发一条消息并刷新会话。",
          },
          { status: 409 },
        )
      }
      throw error
    }

    return NextResponse.json({ ok: true, message: "测试消息已发送" })
  } catch (error) {
    console.error("[CHANNEL_TEST]", error)
    const message = error instanceof Error ? error.message : "send_failed"
    return NextResponse.json({ ok: false, error: "send_failed", message }, { status: 502 })
  }
}
