import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { endpoints } from "@/lib/db/schema/endpoints"
import { channels } from "@/lib/db/schema/channels"
import { eq } from "drizzle-orm"
import { Channel } from "@/lib/channels"
import { EndpointsTabs } from "@/components/endpoints-tabs"
import { PageHeader } from "@/components/shell/page-header"

export const dynamic = "force-dynamic"

async function getEndpoints(userId: string) {
  const db = await getDb()
  return db.query.endpoints.findMany({
    where: eq(endpoints.userId, userId),
    orderBy: (endpoints, { desc }) => [desc(endpoints.createdAt)],
  })
}

async function getChannels(userId: string) {
  const db = await getDb()
  return db.query.channels.findMany({
    where: eq(channels.userId, userId),
    orderBy: (channels, { desc }) => [desc(channels.createdAt)],
  })
}

export default async function EndpointsPage() {
  const session = await auth()

  const [endpointList, channelList] = await Promise.all([
    getEndpoints(session!.user!.id!),
    getChannels(session!.user!.id!),
  ])

  return (
    <div>
      <PageHeader
        title="接口"
        description="创建推送接口、配置消息模板，或把多个接口组成一组一起发送。"
      />
      <EndpointsTabs 
        initialEndpoints={endpointList}
        channels={channelList as Channel[]} 
      />
    </div>
  )
}
