import { Composer, InlineKeyboard } from "grammy"

const URL_PATTERN = /https?:\/\/[^\s]+/

const demo = new Composer()

const keyboard = (data: string) => InlineKeyboard.from([[
    InlineKeyboard.url('❤️', 'https://vernam.zeckson.com'),
    InlineKeyboard.text('Delete', 'delete'),
    InlineKeyboard.webApp(`Open in browser`, `https://vernam.zeckson.com`),
    InlineKeyboard.webApp(`Open in browser (data)`, `https://vernam.zeckson.com?data=${data}`)
]])

demo.command(`start`, (ctx) => ctx.reply('Hello'))

demo.command(`help`, (ctx) => ctx.reply('Help message'))
demo.on(
    'message',
    async (ctx) => {
        const messageText = ctx.message.text
        if (!messageText) return

        const match = messageText.match(URL_PATTERN)
        if (!match) return

        const url = match[0]
        await ctx.reply(messageText, { reply_markup: keyboard(url) })
    }
)
demo.callbackQuery('delete', (ctx) => ctx.deleteMessage())

export default demo
