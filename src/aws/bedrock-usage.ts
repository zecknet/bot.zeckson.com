import { GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer'
import { costExplorer, formatDate } from './cost-explorer.ts'

const client = costExplorer

// Token usage tracker function
export async function getTokenUsage(
	timeframe: '7d' | '1d' = '7d',
	service = 'Amazon Bedrock',
) {
	const end = new Date()
	const start = new Date()

	// Dynamically calculate the requested historical window
	const daysAgo = timeframe === '7d' ? 7 : 1
	start.setDate(end.getDate() - daysAgo)

	const command = new GetCostAndUsageCommand({
		TimePeriod: {
			Start: formatDate(start),
			End: formatDate(end),
		},
		Granularity: 'DAILY',
		// SWITCH: Requesting raw structural volume instead of financial numbers
		Metrics: ['UsageQuantity'],
		Filter: {
			Dimensions: {
				Key: 'SERVICE',
				Values: [service],
			},
		},
		// Groups token counts by specific Input vs Output model lines
		GroupBy: [
			{
				Key: 'USAGE_TYPE',
				Type: 'DIMENSION',
			},
		],
	})

	const explorerClient = client()
	try {
		const res = await explorerClient.send(command)

		return res.ResultsByTime?.map((day) => {
			const breakdowns = day.Groups?.map((group) => {
				const usageType = group.Keys?.[0] ?? 'Unknown'
				const tokenCount = Number(
					group.Metrics?.UsageQuantity?.Amount ?? 0,
				)

				return { usageType, tokenCount }
			}).filter((b) => b.tokenCount > 0) // Filter out inactive types

			const totalForDay = Number(day.Total?.UsageQuantity?.Amount ?? 0)

			return {
				date: day.TimePeriod?.Start,
				totalTokens: totalForDay,
				breakdown: breakdowns,
			}
		})
	} finally {
		explorerClient.destroy()
	}
}
