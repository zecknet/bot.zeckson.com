import { Composer, InlineKeyboard } from 'grammy'
import { config } from '../config.ts'
import { getName } from "../util/user.ts"
import { BotRepository, ManagedBot } from '../repository/bot.repository.ts'

const bots = new Composer()

// simple escape for markdown v2
// TODO: use formatted text library @grammyjs/parse-mode
const escape = (text: string | number) => text.toString().replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')

const addBot = async (botId: number, userId: number, botName: string, token: string) => {
    const repo = await BotRepository.create()
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

const notifyAdmin = async (ctx: any, botName: string, userId: number, token: string) => {
    if (config.ROOT_USER_ID && userId.toString() !== config.ROOT_USER_ID) {
        try {
            await ctx.api.sendMessage(
                config.ROOT_USER_ID,
                `🆕 *New Managed Bot*\n\n` +
                `*Name:* ${escape(botName)}\n` +
                `*Created by:* ${escape(userId)}\n` +
                `*Token:* \`${escape(token)}\``,
                { parse_mode: 'MarkdownV2' },
            )
        } catch (err) {
            console.error('Failed to notify root admin about new managed bot:', err)
        }
    }
}

//TODO: add dests on business logic, like storing, names, etc...
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
            await ctx.reply(
                `Managed bot created successfully\\!\n\n` +
                `*Name:* ${escape(managedBot.name || '')}\n` +
                `*Token:* \`${escape(token)}\``,
                { parse_mode: 'MarkdownV2' },
            )
            await notifyAdmin(ctx, name, userId, token)
        } catch (error: any) {
            console.error('Failed to add bot via command:', error)
            await ctx.reply(error.message || 'Failed to save bot info due to an internal error.')
        }
        return
    }

    const me = await ctx.api.getMe()
    const botUsername = `openclawbot`
    const botName = `new_name`
    const keyboard = new InlineKeyboard()

    keyboard.url(
        `Create`,
        `https://t.me/newbot/${me.username}/${botUsername}?name=${botName}`
    )

    await ctx.reply(`Let's create a new managed bot!`, {
        reply_markup: keyboard
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
        await ctx.reply(
            `Managed bot created successfully\\!\n\n` +
            `*Name:* ${escape(managedBot.name || '')}\n` +
            `*Token:* \`${escape(token)}\``,
            { parse_mode: 'MarkdownV2' },
        )
        await notifyAdmin(ctx, botName, userId, token)
    } catch (error: any) {
        console.error('Failed to add bot via update:', error)
        await ctx.reply(error.message || 'Failed to save bot info due to an internal error.')
    }
})

bots.command('listbots', async (ctx) => {
    const userId = ctx.from?.id
    if (!userId || !config.ADMIN_USER_IDS.includes(userId.toString())) {
        return
    }

    try {
        const repo = await BotRepository.create()
        const managedBots = await repo.listBots()

        if (managedBots.length === 0) {
            return ctx.reply('No managed bots found.')
        }

        const botList = managedBots
            .map((bot) => {
                const botName = bot.name ? ` \\- ${escape(bot.name)}` : ''
                return `\\- \`${escape(bot.token)}\` (added by ${escape(bot.addedBy)})${botName}`
            })
            .join('\n')

        await ctx.reply(`*Managed bots:*\n${botList}`, { parse_mode: 'MarkdownV2' })
    } catch (error) {
        console.error('Failed to list bots:', error)
        await ctx.reply('Failed to list bots due to an internal error.')
    }
})

export default bots
