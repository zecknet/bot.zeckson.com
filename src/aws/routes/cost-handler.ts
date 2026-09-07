import { ResultByTime } from '@aws-sdk/client-cost-explorer'
import { Context } from 'grammy'
import { fmt, FormattedString } from '@grammyjs/parse-mode'
import { DailyTokenData, getTokenUsage } from '../bedrock-usage.ts'
import {
	costToDay,
	formatNum,
	formatUSD,
	getDailyCosts,
} from '../cost-explorer.ts'

export const printDayCosts = (period: ResultByTime[]) => {
	const data = period.map(costToDay)
	if (data.length === 0) return fmt`No cost data available.`

	const tableHeader = `| ${'Date'.padEnd(10)} | ${'Cost'.padStart(9)} |`
	const separator = `| ${'-'.repeat(10)} | ${'-'.repeat(9)} |`
	const rows = data.map((it) => `| ${it.date.padEnd(10)} | ${it.cost.padStart(9)} |`)
	const table = [tableHeader, separator, ...rows].join('\n')

	return fmt`Daily costs:
${FormattedString.pre(table)}`
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
	const header = fmt`📅 ${FormattedString.bold('Date:')} ${FormattedString.code(dayData.date)}
📊 ${FormattedString.bold('Total Daily Tokens:')} ${FormattedString.code(formatNum(dayData.totalTokens))}
💰 ${FormattedString.bold('Total Daily Cost:')} ${FormattedString.code(formatUSD(dayData.totalCost))}

${FormattedString.bold('Breakdown by Model:')}
`

	if (dayData.breakdown.length === 0) {
		return fmt`${header}${FormattedString.italic('No active usage recorded for this day.')}`
	}

	// Find max length for usageType to align columns
	const maxUsageTypeLen = Math.max(
		...dayData.breakdown.map((item) => item.usageType.length),
		'Model'.length,
	)

	const tableHeader = `| ${'Model'.padEnd(maxUsageTypeLen)} | ${'Tokens'.padStart(10)} | ${'Cost'.padStart(10)} |`
	const separator = `| ${'-'.repeat(maxUsageTypeLen)} | ${'-'.repeat(10)} | ${'-'.repeat(10)} |`

	const rows = dayData.breakdown.map((item) => {
		const tokens = formatNum(item.tokenCount).padStart(10)
		const cost = formatUSD(item.cost).padStart(10)
		return `| ${item.usageType.padEnd(maxUsageTypeLen)} | ${tokens} | ${cost} |`
	})

	const table = [tableHeader, separator, ...rows].join('\n')

	return fmt`${header}${FormattedString.pre(table)}`
}

export const modelUsages = async (ctx: Context) => {
	const usage = (await getTokenUsage(`1d`))[0]
	if (!usage) {
		return ctx.reply('No usage data found for today.')
	}
	const message = fmt`Model Usages:
${formatTokenUsageRaw(usage)}`
	return ctx.reply(message.text, {
		entities: message.entities,
	})
}
