import { Bot } from 'grammy'
import demo from "./middleware/demo.ts"
import exchange from "./middleware/exchange.ts"
import { log } from "./middleware/log.ts"
import store from "./middleware/store.ts"
import replicate from "./middleware/replicate.ts"

const { BOT_TOKEN } = Deno.env.toObject()
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!')
const bot = new Bot(BOT_TOKEN)

bot.use(log)
bot.use(store)
bot.use(replicate)
bot.use(exchange)
bot.use(demo)

export { bot }
