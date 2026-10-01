import { drizzle } from "drizzle-orm/d1"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/db/schema"
import { channels } from "@/lib/db/schema/channels"
import { parseWeixinConfig, stringifyWeixinConfig, weixinAccountFromChannel } from "./config"
import { getWeixinRuntimeEnv, pollUpdates } from "./ilink"

const BATCH_SIZE = 5

export async function refreshWeixinChannelContext(channel: typeof channels.$inferSelect, env?: CloudflareEnv) {
  const account = weixinAccountFromChannel(channel)
  if (!account.botToken || !account.baseUrl) {
    throw new Error("account_send_not_configured")
  }

  const runtimeEnv = env
    ? { WEIXIN_CHANNEL_VERSION: env.WEIXIN_CHANNEL_VERSION, WEIXIN_APP_ID: env.WEIXIN_APP_ID }
    : getWeixinRuntimeEnv()

  const updates = await pollUpdates(account, runtimeEnv)
  const extra = parseWeixinConfig(channel.config)
  let changed = updates.getUpdatesBuf !== extra.getUpdatesBuf
  extra.getUpdatesBuf = updates.getUpdatesBuf

  for (const message of updates.messages) {
    if (
      message &&
      message.from_user_id === account.defaultRecipient &&
      typeof message.context_token === "string" &&
      message.context_token.length > 0 &&
      message.context_token.length <= 8192 &&
      message.context_token !== extra.contextToken
    ) {
      extra.contextToken = message.context_token
      changed = true
    }
  }

  return { extra, changed, hasContext: Boolean(extra.contextToken) }
}

export async function pollWeixinChannels(env: CloudflareEnv) {
  const db = drizzle(env.DB, { schema })
  const list = await db.query.channels.findMany({
    where: eq(channels.type, "weixin"),
  })

  for (let index = 0; index < list.length; index += BATCH_SIZE) {
    await Promise.all(list.slice(index, index + BATCH_SIZE).map(async (channel) => {
      try {
        const { extra, changed } = await refreshWeixinChannelContext(channel, env)
        if (changed) {
          await db.update(channels)
            .set({ config: stringifyWeixinConfig(extra) })
            .where(eq(channels.id, channel.id))
        }
      } catch (error) {
        const code = error instanceof Error ? error.message : "weixin_updates_failed"
        console.warn("weixin_updates_poll_failed", channel.id, code)
      }
    }))
  }
}
