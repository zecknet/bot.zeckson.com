import { fmt, FormattedString } from '@grammyjs/parse-mode'
import { Composer, Context } from 'grammy'
import { Markdown } from '../finance/finance.md.ts'
import { CommandComposer } from '../util/commands.ts'

const split = (ctx: Context): string[] => ctx.message?.text?.split(` `) ?? []

const router = new Composer<Context>() as CommandComposer<Context>
const EXCHANGE = {
	command: 'exchange',
	description: 'Calculate exchange rate (sent received)',
}
const SEND = {
	command: 'send',
	description: 'Calculate amount to send with commission',
}
const RECEIVED = {
	command: 'received',
	description: 'Calculate received amount with rate',
}
const FINALIZE = {
	command: 'final',
	description: 'Calculate final exchange amount and rate',
}
router.commands = [
	EXCHANGE,
	SEND,
	RECEIVED,
	FINALIZE,
]

router.command(EXCHANGE.command, (ctx) => {
	const [_, sent, received] = split(ctx)
	const message = fmt`Поменял: ${sent} (${received}). Курс: ${
		FormattedString.bold(Markdown.rate(Number(sent), Number(received)))
	}`
	return ctx.reply(message.text, { entities: message.entities })
})
router.command(SEND.command, (ctx) => {
	const [_, sent] = split(ctx)
	const commission = 1
	const message = fmt`Отправил: ${
		FormattedString.bold(sent)
	} (+${commission} commission) = ${
		FormattedString.bold((Number(sent) + commission).toString())
	}`
	return ctx.reply(message.text, { entities: message.entities })
})
router.command(RECEIVED.command, (ctx) => {
	const [_, sent, received] = split(ctx)
	const message = fmt`Обмен USDT -> LKR: ${sent} (${received}). Курс: ${
		FormattedString.bold(Markdown.rate(Number(received), Number(sent)))
	}`
	return ctx.reply(message.text, { entities: message.entities })
})
router.command(FINALIZE.command, (ctx) => {
	const [_, sent, received] = split(ctx)
	const message =
		fmt`Обмен RUB -> LKR (c учётом всех комиссий): ${sent} -> ${received}. Курс: ${
			FormattedString.bold(Markdown.rate(Number(received), Number(sent)))
		}`
	return ctx.reply(message.text, { entities: message.entities })
})

export default router
