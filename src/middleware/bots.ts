import { fmt, FormattedString } from '@grammyjs/parse-mode'
import { Composer, Context, InlineKeyboard } from 'grammy'
import { config } from '../config.ts'
import { BotRepository, ManagedBot } from '../repository/bot.repository.ts'
import { getName } from '../util/user.ts'
import { DenoStore } from '../store/denostore.ts'
import { CommandComposer } from '../util/commands.ts'

const bots = new Composer() as CommandComposer<Context>
bots.commands = [
	{ command: 'addbot', description: 'Add a new managed bot' },
	{ command: 'listbots', description: 'List all managed bots' },
]

const openStore = () => {
	if (config.DENO_KV_URL) return Deno.openKv(config.DENO_KV_URL)
	else return Deno.openKv()
}

const getRepo = async (store?: DenoStore) => {
	if (store) return new BotRepository(store)
	return new BotRepository(new DenoStore(await openStore()))
}

export const addBot = async (
	botId: number,
	userId: number,
	botName: string,
	token: string,
	store?: DenoStore,
) => {
	const repo = await getRepo(store)
	const existing = await repo.getBot(String(botId))

	if (existing) {
		throw new Error('This bot is already managed.')
	}

	const managedBot: ManagedBot = {
		token,
		addedBy: userId,
		addedAt: Date.now(),
		name: botName,
	}

	await repo.saveBot(String(botId), managedBot)
	return managedBot
}

const notifyAdmin = async (
	ctx: Context,
	botName: string,
	userId: number,
	token: string,
) => {
	if (config.ROOT_USER_ID && userId.toString() !== config.ROOT_USER_ID) {
		try {
			const message = fmt`🆕 ${FormattedString.b(`New Managed Bot`)}

${FormattedString.b('Name:')} ${botName}
${FormattedString.b('Created by:')} ${userId}
${FormattedString.b('Token:')} ${FormattedString.code(token)}`

			await ctx.api.sendMessage(
				config.ROOT_USER_ID,
				message.text,
				{
					entities: message.entities,
				},
			)
		} catch (err) {
			console.error(
				'Failed to notify root admin about new managed bot:',
				err,
			)
		}
	}
}

bots.command('addbot', async (ctx) => {
	const userId = ctx.from?.id
	if (!userId || !config.ADMIN_USER_IDS.includes(userId.toString())) {
		return
	}

	const botIdStr = ctx.match
	if (botIdStr) {
		const botId = parseInt(botIdStr)
		if (isNaN(botId)) {
			return ctx.reply('Invalid bot ID. Please provide a numeric ID.')
		}
		let name = 'Managed Bot'
		try {
			const botInfo = await ctx.api.getChat(botId)
			name = getName(botInfo)
		} catch (e) {
			console.warn(`Could not get bot name for ID ${botId}:`, e)
		}
		try {
			const token = await ctx.api.getManagedBotToken(botId)
			const managedBot = await addBot(botId, userId, name, token)
			const message = fmt`Managed bot created successfully!

${FormattedString.b('Name:')} ${managedBot.name || ''}
${FormattedString.b('Token:')} ${FormattedString.code(token)}`

			await ctx.reply(
				message.text,
				{
					entities: message.entities,
				},
			)
			await notifyAdmin(ctx, name, userId, token)
		} catch (error: unknown) {
			const message = error instanceof Error
				? error.message
				: 'Failed to save bot info due to an internal error.'
			console.error('Failed to add bot via command:', error)
			await ctx.reply(message)
		}
		return
	}

	const me = await ctx.api.getMe()
	const botUsername = `openclawbot`
	const botName = `new_name`
	const keyboard = new InlineKeyboard()

	keyboard.url(
		`Create`,
		`https://t.me/newbot/${me.username}/${botUsername}?name=${botName}`,
	)

	await ctx.reply(`Let's create a new managed bot!`, {
		reply_markup: keyboard,
	})
})

bots.on('managed_bot', async (ctx) => {
	const bot = ctx.managedBot.bot
	const userId = ctx.managedBot.user.id

	if (!userId) return

	try {
		const botId = bot.id
		const botName = getName(bot)
		const token = await ctx.api.getManagedBotToken(botId)
		const managedBot = await addBot(botId, userId, botName, token)
		const message = fmt`Managed bot created successfully!

${FormattedString.b('Name:')} ${managedBot.name || ''}
${FormattedString.b('Token:')} ${FormattedString.code(token)}`

		await ctx.reply(
			message.text,
			{
				entities: message.entities,
			},
		)
		await notifyAdmin(ctx, botName, userId, token)
	} catch (error: unknown) {
		const message = error instanceof Error
			? error.message
			: 'Failed to save bot info due to an internal error.'
		console.error('Failed to add bot via update:', error)
		await ctx.reply(message)
	}
})

bots.command('listbots', async (ctx) => {
	const userId = ctx.from?.id
	if (!userId || !config.ADMIN_USER_IDS.includes(userId.toString())) {
		return
	}

	try {
		const repo = await getRepo()
		const managedBots = await repo.listBots()

		if (managedBots.length === 0) {
			return ctx.reply('No managed bots found.')
		}

		const botList = managedBots.map((bot) => {
			const botName = bot.name ? fmt` - ${bot.name}` : ''
			return fmt`- ${
				FormattedString.code(bot.token)
			} (added by ${bot.addedBy})${botName}`
		})

		console.log(botList)

		const message = fmt`${FormattedString.b(`Managed bots:`)} 
        ${botList.join('\n')}`

		await ctx.reply(message.text, {
			entities: message.entities,
		})
	} catch (error) {
		console.error('Failed to list bots:', error)
		await ctx.reply('Failed to list bots due to an internal error.')
	}
})

export default bots
