import { ResultByTime } from '@aws-sdk/client-cost-explorer'
import { fmt, FormattedString } from '@grammyjs/parse-mode'
import { Context } from 'grammy'
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
	const rows = data.map((it) =>
		`| ${it.date.padEnd(10)} | ${it.cost.padStart(9)} |`
	)
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
	const header = `📅 **Date:** \`${dayData.date}\`

📊 **Total Daily Tokens:** \`${formatNum(dayData.totalTokens)}\`

💰 **Total Daily Cost:** \`${formatUSD(dayData.totalCost)}\`


**Breakdown by Model:**
`

	if (dayData.breakdown.length === 0) {
		return `${header}\n_No active usage recorded for this day._`
	}

	// Find max length for usageType to align columns
	const maxUsageTypeLen = Math.max(
		...dayData.breakdown.map((item) => item.usageType.length),
		'Model'.length,
	)

	const tableHeader = `| Model | Tokens | Cost |`
	const separator = `|:${'-'.repeat(maxUsageTypeLen)}|:${'-'.repeat(10)}:|:${
		'-'.repeat(10)
	}:|`

	const rows = dayData.breakdown.map((item) => {
		const tokens = formatNum(item.tokenCount)
		const cost = formatUSD(item.cost)
		return `| ${item.usageType} | ${tokens} | ${cost} |`
	})

	const table = [tableHeader, separator, ...rows].join('\n')

	return `${header}\n${table}`
}

export const modelUsages = async (ctx: Context) => {
	const usage = (await getTokenUsage(`1d`))[0]
	if (!usage) {
		return ctx.reply('No usage data found for today.')
	}
	return ctx.replyWithRichMessage({
		markdown: `Model Usages:
		
${formatTokenUsageRaw(usage)}`,
	})
}
