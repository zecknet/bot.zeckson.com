import { Context } from "grammy"
import { DenoStore } from "../store/denostore.ts"
import { config } from "../config.ts"

const openStore = () => {
    if (config.DENO_KV_URL) return Deno.openKv(config.DENO_KV_URL)
    else return Deno.openKv()
}
const store = new DenoStore(await openStore())

const users = await store.list({ prefix: ['user'] })

console.log(`Records in DB: ${users.length}`)

export default async (ctx: Context, next: () => Promise<void>) => {
    const user = ctx.from
    if (user) {
        const userkey = [`user`, user.id]
        const entry = await store.load(userkey)
        if (!entry.value) {
            await store.save(userkey, user)
            console.debug(`Saved user: ${JSON.stringify(user)}`)
        } else {
            console.debug(`Existing entry: ${JSON.stringify(entry)}`)
        }
    }
    return await next()
}
