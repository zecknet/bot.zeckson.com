import { Bot } from 'grammy'
import { hydrateReply, parseMode } from "@grammyjs/parse-mode";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import { config } from "./config.ts"
import { auth } from "./middleware/auth.ts"
import demo from "./middleware/demo.ts"
import exchange from "./middleware/exchange.ts"
import { log } from "./middleware/log.ts"
import store from "./middleware/store.ts"
import replicate from "./middleware/replicate.ts"

const bot = new Bot<ParseModeFlavor>(config.BOT_TOKEN)

bot.use(hydrateReply);
bot.api.config.use(parseMode("HTML"));

bot.use(log)
bot.use(store)
bot.use(auth)
bot.use(replicate)
bot.use(exchange)
bot.use(demo)

export { bot }
