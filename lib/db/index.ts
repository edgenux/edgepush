import { getCloudflareContext } from "@opennextjs/cloudflare"
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1"
import * as schema from "./schema"

let _db: DrizzleD1Database<typeof schema> | undefined
let _d1: D1Database | undefined

export const getDb = () => {
    const { env } = getCloudflareContext()
    if (!_db || _d1 !== env.DB) {
        _d1 = env.DB
        _db = drizzle(env.DB, { schema })
    }
    return _db
}
