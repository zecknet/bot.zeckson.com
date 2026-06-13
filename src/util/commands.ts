import { Api, Bot, Composer, Context, NextFunction } from 'grammy'

const BOT_NAME = 'Zeckson Bot'

export interface CommandComposer<C extends Context> extends Composer<C> {
	commands?: { command: string; description: string }[]
}

export type BotMiddleware =
	| CommandComposer<Context>
	| Composer<Context>
	| ((ctx: Context, next: NextFunction) => Promise<void>)

export const setupBotCommands = async (
	bot: Bot | Api,
	middlewares: BotMiddleware[],
) => {
	const api = bot instanceof Bot ? bot.api : bot
	const commands = middlewares
		.flatMap((m) => {
			if (typeof m === 'object' && m !== null && 'commands' in m) {
				const cm = m as CommandComposer<Context>
				return cm.commands && Array.isArray(cm.commands) ? cm.commands : []
			}
			return []
		})

	await api.setMyCommands(commands)
}

export const setupBotInfo = async (bot: Bot | Api) => {
	const api = bot instanceof Bot ? bot.api : bot
	await api.setMyName(BOT_NAME)
	await api.setMyDescription(`${BOT_NAME} - Personal assistant of @zeckson.`)
	await api.setMyShortDescription(
		'Мой личный бот-помощник / My personal assistant bot',
	)
}
