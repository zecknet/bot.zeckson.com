import { ResultByTime } from '@aws-sdk/client-cost-explorer'
import { Context } from 'grammy'
import { fmt, FormattedString } from '@grammyjs/parse-mode'
import { DailyTokenData, getTokenUsage } from '../bedrock-usage.ts'
import { costToDay, formatNum, getDailyCosts } from '../cost-explorer.ts'

export const printDayCosts = (period: ResultByTime[]) => {
	const data = period.map(costToDay)
	if (data.length === 0) return fmt`No cost data available.`

	const rows = data.map((it) => `${it.date}: ${it.cost.padStart(9)}`)
	return fmt`Daily costs:
${FormattedString.pre(rows.join('\n'))}`
}

export const bedrockWeeklyCosts = async (ctx: Context) => {
	const costs = await getDailyCosts('Amazon Bedrock')
	const message = fmt`Amazon Bedrock last 7 days:
${printDayCosts(costs)}`
	return ctx.reply(message.text, { entities: message.entities })
}

export const ec2WeeklyCosts = async (ctx: Context) => {
	const costs = await getDailyCosts('EC2')
	const message = fmt`EC2 last 7 days:
${printDayCosts(costs)}`
	return ctx.reply(message.text, { entities: message.entities })
}

export const formatTokenUsageRaw = (dayData: DailyTokenData) => {
	// Dynamically calculate total from the array items
	const actualTotal = dayData.breakdown.reduce(
		(sum, item) => sum + item.tokenCount,
		0,
	)

	const header = fmt`📅 ${FormattedString.bold('Date:')} ${FormattedString.code(dayData.date)}
📊 ${FormattedString.bold('Total Daily Tokens:')} ${FormattedString.code(formatNum(actualTotal))}

${FormattedString.bold('Breakdown by Model:')}
`

	if (dayData.breakdown.length === 0) {
		return fmt`${header}${FormattedString.italic('No active usage recorded for this day.')}`
	}

	const rows = dayData.breakdown.map((item) =>
		`${item.usageType}: ${formatNum(item.tokenCount).padStart(10)}`
	)

	return fmt`${header}${FormattedString.pre(rows.join('\n'))}`
}

export const modelUsages = async (ctx: Context) => {
	const usage = (await getTokenUsage(`1d`))[0]
	const message = fmt`Model Usages:
${formatTokenUsageRaw(usage)}`
	return ctx.reply(message.text, {
		entities: message.entities,
	})
}
