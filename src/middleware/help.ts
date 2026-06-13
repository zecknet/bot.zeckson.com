import { Composer, Context, InlineKeyboard } from 'grammy'
import { CommandComposer } from '../util/commands.ts'

const URL_PATTERN = /https?:\/\/[^\s]+/

const help = new Composer<Context>() as CommandComposer<Context>
const START = { command: 'start', description: 'Start the bot' }
const HELP = { command: 'help', description: 'Show help message' }
help.commands = [
	START,
	HELP,
]

const keyboard = (data: string) =>
	InlineKeyboard.from([[
		InlineKeyboard.url('❤️', 'https://vernam.zeckson.com'),
		InlineKeyboard.text('Delete', 'delete'),
		InlineKeyboard.webApp(`Open in browser`, `https://vernam.zeckson.com`),
		InlineKeyboard.webApp(
			`Open in browser (data)`,
			`https://vernam.zeckson.com?data=${data}`,
		),
	]])

help.command(START.command, (ctx) => ctx.reply('Hello'))

help.command(HELP.command, (ctx) => ctx.reply('Help message'))
help.on(
	'message',
	async (ctx) => {
		const messageText = ctx.message.text
		if (!messageText) return

		const match = messageText.match(URL_PATTERN)
		if (!match) return

		const url = match[0]
		await ctx.reply(messageText, { reply_markup: keyboard(url) })
	},
)
help.callbackQuery('delete', (ctx) => ctx.deleteMessage())

export default help
