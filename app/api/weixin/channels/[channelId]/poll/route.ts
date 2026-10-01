import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { channels } from "@/lib/db/schema/channels"
import { CHANNEL_TYPES } from "@/lib/channels"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { stringifyWeixinConfig } from "@/lib/weixin/config"
import { refreshWeixinChannelContext } from "@/lib/weixin/poll"

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

    const { extra, hasContext } = await refreshWeixinChannelContext(channel)
    await db.update(channels)
      .set({ config: stringifyWeixinConfig(extra) })
      .where(eq(channels.id, channel.id))

    return NextResponse.json({
      ok: true,
      hasContext,
      config: stringifyWeixinConfig(extra),
    })
  } catch (error) {
    console.error("[WEIXIN_POLL]", error)
    const code = error instanceof Error ? error.message : "weixin_updates_failed"
    return NextResponse.json({ ok: false, error: code }, { status: 502 })
  }
}
