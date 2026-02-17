import { Bot } from 'grammy'
import { config } from "./config.ts"
import { auth } from "./middleware/auth.ts"
import demo from "./middleware/demo.ts"
import exchange from "./middleware/exchange.ts"
import { log } from "./middleware/log.ts"
import store from "./middleware/store.ts"
import replicate from "./middleware/replicate.ts"

const bot = new Bot(config.BOT_TOKEN)

bot.use(log)
bot.use(store)
bot.use(auth)
bot.use(replicate)
bot.use(exchange)
bot.use(demo)

export { bot }
