import { Bot } from 'grammy'
import { config } from './config.ts'
import { setup } from './middleware/index.ts'

const bot = new Bot(config.BOT_TOKEN)

await setup(bot)

export { bot }
