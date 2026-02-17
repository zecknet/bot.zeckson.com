import { Composer, Context } from "grammy"
import { fmt, bold } from "@grammyjs/parse-mode"
import { Markdown } from "../finance/finance.md.ts"

const split = (ctx: Context) => ctx.message?.text?.split(` `) ?? []

const router = new Composer()

router.command(`exchange`, (ctx) => {
	const [_, sent, received] = split(ctx)
	return ctx.replyFmt(fmt`Поменял: ${sent} (${received}). Курс: ${bold(Markdown.rate(Number(sent), Number(received)))}`)
})
router.command(`send`, (ctx) => {
	const [_, sent] = split(ctx)
	const commission = 1
	return ctx.replyFmt(fmt`Отправил: ${bold(sent)} (+${commission} commission) = ${bold((Number(sent) + commission).toString())}`)
})
router.command(`received`, (ctx) => {
	const [_, sent, received] = split(ctx)
	return ctx.replyFmt(fmt`Обмен USDT -> LKR: ${sent} (${received}). Курс: ${bold(Markdown.rate(Number(received), Number(sent)))}`)
})
router.command(`final`, (ctx) => {
	const [_, sent, received] = split(ctx)
	return ctx.replyFmt(fmt`Обмен RUB -> LKR (c учётом всех комиссий): ${sent} -> ${received}. Курс: ${bold(Markdown.rate(Number(received), Number(sent)))}`)
})

export default router
