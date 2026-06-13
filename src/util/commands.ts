import { Api, Bot } from 'grammy'

const BOT_NAME = 'Zeckson Bot'

export const BOT_COMMANDS = [
	{ command: 'start', description: 'Start the bot' },
	{ command: 'help', description: 'Show help message' },
	{ command: 'addbot', description: 'Add a new managed bot' },
	{ command: 'listbots', description: 'List all managed bots' },
	{ command: 'ec2', description: 'Manage AWS EC2 instances' },
	{ command: 'bot', description: 'Interact with Replicate AI' },
	{ command: 'exchange', description: 'Calculate exchange rate (sent received)' },
	{ command: 'send', description: 'Calculate amount to send with commission' },
	{ command: 'received', description: 'Calculate received amount with rate' },
	{ command: 'final', description: 'Calculate final exchange amount and rate' },
	{ command: 'topic', description: 'Get current topic information' },
]

export const setupBotCommands = async (bot: Bot | Api) => {
	const api = bot instanceof Bot ? bot.api : bot
	await api.setMyCommands(BOT_COMMANDS)
}

export const setupBotInfo = async (bot: Bot | Api) => {
	const api = bot instanceof Bot ? bot.api : bot
	await api.setMyName(BOT_NAME)
	await api.setMyDescription(`${BOT_NAME} - Personal assistant of @zeckson.`)
	await api.setMyShortDescription('Мой личный бот-помощник / My personal assistant bot')
}
