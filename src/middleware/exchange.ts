import { Composer, Context } from 'grammy'
import { fmt, FormattedString } from '@grammyjs/parse-mode'
import { Markdown } from '../finance/finance.md.ts'
import { CommandComposer } from '../util/commands.ts'

const split = (ctx: Context) => ctx.message?.text?.split(` `) ?? []

const router = new Composer<Context>() as CommandComposer<Context>
router.commands = [
	{
		command: 'exchange',
		description: 'Calculate exchange rate (sent received)',
	},
	{ command: 'send', description: 'Calculate amount to send with commission' },
	{ command: 'received', description: 'Calculate received amount with rate' },
	{ command: 'final', description: 'Calculate final exchange amount and rate' },
]

router.command(`exchange`, (ctx) => {
	const [_, sent, received] = split(ctx)
	const message = fmt`Поменял: ${sent} (${received}). Курс: ${
		FormattedString.bold(Markdown.rate(Number(sent), Number(received)))
	}`
	return ctx.reply(message.text, { entities: message.entities })
})
router.command(`send`, (ctx) => {
	const [_, sent] = split(ctx)
	const commission = 1
	const message = fmt`Отправил: ${
		FormattedString.bold(sent)
	} (+${commission} commission) = ${
		FormattedString.bold((Number(sent) + commission).toString())
	}`
	return ctx.reply(message.text, { entities: message.entities })
})
router.command(`received`, (ctx) => {
	const [_, sent, received] = split(ctx)
	const message = fmt`Обмен USDT -> LKR: ${sent} (${received}). Курс: ${
		FormattedString.bold(Markdown.rate(Number(received), Number(sent)))
	}`
	return ctx.reply(message.text, { entities: message.entities })
})
router.command(`final`, (ctx) => {
	const [_, sent, received] = split(ctx)
	const message =
		fmt`Обмен RUB -> LKR (c учётом всех комиссий): ${sent} -> ${received}. Курс: ${
			FormattedString.bold(Markdown.rate(Number(received), Number(sent)))
		}`
	return ctx.reply(message.text, { entities: message.entities })
})

export default router
