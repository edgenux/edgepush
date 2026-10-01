import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/db/schema"
import { channels } from "@/lib/db/schema/channels"
import { parseWeixinConfig, stringifyWeixinConfig, weixinAccountFromChannel, type WeixinChannelConfig } from "./config"
import { getWeixinRuntimeEnv, pollUpdates } from "./ilink"

const BATCH_SIZE = 5

type AppDb = DrizzleD1Database<typeof schema>

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

async function persistWeixinConfig(db: AppDb, channelId: string, extra: WeixinChannelConfig) {
  const config = stringifyWeixinConfig(extra)
  await db.update(channels)
    .set({ config })
    .where(eq(channels.id, channelId))
  return config
}

export async function syncWeixinChannelRecord(
  db: AppDb,
  channel: typeof channels.$inferSelect,
  env?: CloudflareEnv,
) {
  const { extra, changed, hasContext } = await refreshWeixinChannelContext(channel, env)
  const config = changed
    ? await persistWeixinConfig(db, channel.id, extra)
    : stringifyWeixinConfig(extra)
  return { extra, config, hasContext, changed }
}

export async function clearWeixinChannelContext(
  db: AppDb,
  channel: typeof channels.$inferSelect,
) {
  const extra = parseWeixinConfig(channel.config)
  extra.contextToken = ""
  const config = await persistWeixinConfig(db, channel.id, extra)
  return { extra, config }
}

export async function pollWeixinChannels(env: CloudflareEnv) {
  const db = drizzle(env.DB, { schema })
  const list = await db.query.channels.findMany({
    where: eq(channels.type, "weixin"),
  })

  for (let index = 0; index < list.length; index += BATCH_SIZE) {
    await Promise.all(list.slice(index, index + BATCH_SIZE).map(async (channel) => {
      try {
        await syncWeixinChannelRecord(db, channel, env)
      } catch (error) {
        const code = error instanceof Error ? error.message : "weixin_updates_failed"
        console.warn("weixin_updates_poll_failed", channel.id, code)
      }
    }))
  }
}
