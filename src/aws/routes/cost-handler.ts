import { ResultByTime } from '@aws-sdk/client-cost-explorer'
import { Context } from 'grammy'
import { DailyTokenData, getTokenUsage } from '../bedrock-usage.ts'
import { costToDay, formatNum, getDailyCosts } from '../cost-explorer.ts'

export const printDayCosts = (period: ResultByTime[]) =>
	`Daily costs:${
		period.map(costToDay).map((it) => `${it.date}: ${it.cost}`).join('\n')
	}`

export const bedrockWeeklyCosts = async (ctx: Context) => {
	const costs = await getDailyCosts('Amazon Bedrock')
	return ctx.reply(`Amazon Bedrock last 7 days:
    ${printDayCosts(costs)}`)
}

export const ec2WeeklyCosts = async (ctx: Context) => {
	const costs = await getDailyCosts('EC2')
	return ctx.reply(`Amazon Bedrock last 7 days:
    ${printDayCosts(costs)}`)
}

export const formatTokenUsageRaw = (dayData: DailyTokenData): string => {
	// Dynamically calculate total from the array items
	const actualTotal = dayData.breakdown.reduce(
		(sum, item) => sum + item.tokenCount,
		0,
	)

	let message = `📅 *Date:* \`${dayData.date}\`\n`
	message += `📊 *Total Daily Tokens:* \`${formatNum(actualTotal)}\`\n\n`
	message += `*Breakdown by Model:*\n`

	if (dayData.breakdown.length > 0) {
		for (const item of dayData.breakdown) {
			// Kept exactly as returned by the AWS API response payload
			message += `• \`${item.usageType}\`: *${
				formatNum(item.tokenCount)
			}*\n`
		}
	} else {
		message += `_No active usage recorded for this day._\n`
	}

	return message
}

export const modelUsages = async (ctx: Context) => {
	return ctx.reply(
		`Model Usages:
	${formatTokenUsageRaw((await getTokenUsage(`1d`))[0])}`,
		{
			parse_mode: 'Markdown',
		},
	)
}
