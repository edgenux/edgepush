import { auth } from "@/lib/auth"
import { ChannelTable } from "@/components/channel-table"
import { getDb } from "@/lib/db"
import { channels } from "@/lib/db/schema/channels"
import { eq } from "drizzle-orm"
import type { Channel } from "@/lib/channels"
import { PageHeader } from "@/components/shell/page-header"

export const dynamic = "force-dynamic"

async function getChannels(userId: string) {
  const db = await getDb()
  return db.query.channels.findMany({
    where: eq(channels.userId, userId),
    orderBy: (channels, { desc }) => [desc(channels.createdAt)],
  })
}

export default async function ChannelsPage() {
  const session = await auth()

  const channelList = await getChannels(session!.user!.id!)

  return (
    <div>
      <PageHeader
        title="渠道"
        description="连接钉钉、企业微信、Telegram、Discord 等推送渠道。"
      />
      <ChannelTable channels={channelList as Channel[]} />
    </div>
  )
}
