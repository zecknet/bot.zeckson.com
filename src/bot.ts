import { Bot } from 'grammy'
import { config } from './config.ts'
import { auth } from './middleware/auth.ts'
import aws from './middleware/aws.ts'
import demo from './middleware/demo.ts'
import exchange from './middleware/exchange.ts'
import { log } from './middleware/log.ts'
import replicate from './middleware/replicate.ts'
import bots from './middleware/bots.ts'
import store from './middleware/store.ts'
import topics from './middleware/topics.ts'
import { setupBotCommands, setupBotInfo } from './util/commands.ts'

const bot = new Bot(config.BOT_TOKEN)

await setupBotInfo(bot)
await setupBotCommands(bot)

bot.use(log)
bot.use(store)
bot.use(auth)
bot.use(bots)
bot.use(aws)
bot.use(topics)
bot.use(replicate)
bot.use(exchange)
bot.use(demo)

export { bot }
