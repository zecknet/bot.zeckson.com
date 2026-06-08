import { Composer, InlineKeyboard } from 'grammy'
import { config } from '../config.ts'
import { DenoStore } from '../store/denostore.ts'
import { getName } from "../util/user.ts"

const bots = new Composer()

const openStore = async () => {
    const kv = await (config.DENO_KV_URL ? Deno.openKv(config.DENO_KV_URL) : Deno.openKv())
    return new DenoStore(kv)
}

interface ManagedBot {
    token: string
    addedBy: number
    addedAt: number
    name?: string
}

// simple escape for markdown v2
// TODO: use formatted text library @grammyjs/parse-mode
const escape = (text: string | number) => text.toString().replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')

//TODO: split storing logic and business logic to different file/files
//TODO: add dests on business logic, like storing, names, etc...
bots.command('addbot', async (ctx) => {
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

    const token = await ctx.api.getManagedBotToken(bot.id)
    const botKey = ['managed_bot', String(bot.id)]

    try {
        const store = await openStore()
        const existing = await store.load(botKey)

        if (existing.value) {
            return ctx.reply('This bot is already managed.')
        }

        const managedBot: ManagedBot = {
            token,
            addedBy: userId,
            addedAt: Date.now(),
            name: getName(bot),
        }

        await store.save(botKey, managedBot)
        await ctx.reply(
            `Managed bot created successfully\\!\n\n` +
            `*Name:* ${escape(managedBot.name)}\n` +
            `*Token:* \`${escape(token)}\``,
            { parse_mode: 'MarkdownV2' },
        )

        // Notify root admin if it was not them who created it
        if (config.ROOT_USER_ID && userId.toString() !== config.ROOT_USER_ID) {
            try {
                await ctx.api.sendMessage(
                    config.ROOT_USER_ID,
                    `🆕 *New Managed Bot*\n\n` +
                    `*Name:* ${escape(bot.name)}\n` +
                    `*Created by:* ${escape(userId)}\n` +
                    `*Token:* \`${escape(token)}\``,
                    { parse_mode: 'MarkdownV2' },
                )
            } catch (err) {
                console.error('Failed to notify root admin about new managed bot:', err)
            }
        }
    } catch (error) {
        console.error('Failed to save managed bot shared:', error)
        await ctx.reply('Failed to save bot info due to an internal error.')
    }
})

bots.command('listbots', async (ctx) => {
    const userId = ctx.from?.id
    if (!userId || !config.ADMIN_USER_IDS.includes(userId.toString())) {
        return
    }

    // simple escape for markdown v2
    const escape = (text: string | number) => text.toString().replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')

    try {
        const store = await openStore()
        const managedBots = await store.list({ prefix: ['managed_bot'] })

        if (managedBots.length === 0) {
            return ctx.reply('No managed bots found.')
        }

        const botList = managedBots
            .map((entry) => {
                const bot = entry.value as ManagedBot
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
