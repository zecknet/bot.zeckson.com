import { getTokenUsage } from './bedrock-usage.ts'
import { getDailyCosts, getMonthlyCosts, toUSD } from './cost-explorer.ts'
import { formatTokenUsageRaw, printDayCosts } from './routes/cost-handler.ts'

Deno.test({
	name: 'CostExplorer',
	ignore: true,
	permissions: {
		read: true,
		env: true,
		sys: true,
		net: true,
	},
	async fn() {
		await import('../config.local.ts')
		const costs = await getDailyCosts('EC2', 'Amazon Bedrock')
		console.log(printDayCosts(costs))
		const mtdCosts = await getMonthlyCosts('EC2', 'Amazon Bedrock')
		const message =
			`From: ${mtdCosts?.TimePeriod?.Start} To: ${mtdCosts?.TimePeriod?.End}
		Total service used: ${toUSD(mtdCosts?.Total?.UnblendedCost)}
		Total tokens used: ${
				Number(mtdCosts?.Total?.UsageQuantity.Amount ?? 0) / 1000
			} mln tokens used `
		console.log('MTD cost:', message)

		const usage1d = await getTokenUsage('1d')
		console.log(formatTokenUsageRaw(usage1d[0]))
	},
})
