import { ResultByTime } from '@aws-sdk/client-cost-explorer'
import { Context } from 'grammy'
import { costToDay, getDailyCosts } from '../cost-explorer.ts'

export const printDayCosts = (period: ResultByTime[]) =>
	`Daily costs:${
		period.map(costToDay).map((it) => `${it.date}: ${it.cost}`).join('\n')
	}`

export const costHandler = async (ctx: Context) => {
	const costs = await getDailyCosts()
	return ctx.reply(`Amazon Bedrock last 7 days:
    ${printDayCosts(costs)}`)
}
