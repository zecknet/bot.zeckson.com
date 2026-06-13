import { Bot } from "grammy"
import { BotMiddleware, setupBotCommands, setupBotInfo } from "../util/commands.ts"

import { auth } from "./filters/auth.ts"
import { log } from "./filters/log.ts"
import store from "./filters/store.ts"
import aws from "./routes/aws.ts"
import bots from "./routes/bots.ts"
import exchange from "./routes/exchange.ts"
import help from "./routes/help.ts"
import replicate from "./routes/replicate.ts"
import topics from "./routes/topics.ts"

const registerFilters = (bot: Bot) => {
    bot.use(log)
    bot.use(store)
    bot.use(auth)
}

const routes: BotMiddleware[] = [
    bots,
    aws,
    topics,
    replicate,
    exchange,
    help,
]

const registerRoutes = async (bot: Bot) => {
    routes.forEach((m) => bot.use(m))

    await setupBotCommands(bot, routes)
    await setupBotInfo(bot)
}

export const setup = async (bot: Bot) => {
    registerFilters(bot)
    await registerRoutes(bot)
}
