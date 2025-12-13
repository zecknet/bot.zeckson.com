import { Composer, InlineKeyboard } from "grammy"

const demo = new Composer()

const keyboard = InlineKeyboard.from([[
    InlineKeyboard.url('❤️', 'https://vernam.zeckson.com'),
    InlineKeyboard.text('Delete', 'delete'),
    InlineKeyboard.webApp(`Open in browser`, `https://vernam.zeckson.com`),
    InlineKeyboard.webApp(`Open in browser (data)`, `https://vernam.zeckson.com?data=${Date.now()}`)
]])

demo.command(`start`, (ctx) => ctx.reply('Hello'))

demo.command(`help`, (ctx) => ctx.reply('Help message'))
demo.on(
    'message',
    (ctx) => ctx.copyMessage(ctx.message.chat.id, { reply_markup: keyboard }),
)
demo.callbackQuery('delete', (ctx) => ctx.deleteMessage())

export default demo
