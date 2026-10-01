// @ts-ignore generated at OpenNext build time
import { default as handler } from "../.open-next/worker.js"
import { pollWeixinChannels } from "../lib/weixin/poll"

export default {
  fetch: handler.fetch,

  async scheduled(_controller: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) {
    ctx.waitUntil(pollWeixinChannels(env))
  },
} satisfies ExportedHandler<CloudflareEnv>
