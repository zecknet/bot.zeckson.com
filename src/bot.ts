import { Bot } from 'grammy'
import { config } from './config.ts'
import { auth } from './middleware/auth.ts'
import aws from './middleware/aws.ts'
import help from './middleware/help.ts'
import exchange from './middleware/exchange.ts'
import { log } from './middleware/log.ts'
import replicate from './middleware/replicate.ts'
import bots from './middleware/bots.ts'
import store from './middleware/store.ts'
import topics from './middleware/topics.ts'
import { setupBotCommands, setupBotInfo, BotMiddleware } from './util/commands.ts'

const bot = new Bot(config.BOT_TOKEN)

await setupBotInfo(bot)

const middlewares: BotMiddleware[] = [
	log,
	store,
	auth,
	bots,
	aws,
	topics,
	replicate,
	exchange,
	help,
]

await setupBotCommands(bot, middlewares)

middlewares.forEach((m) => bot.use(m))

export { bot }
