import '../config.local.ts'
import { getDailyCosts, getMTDCost, toUSD } from './cost-explorer.ts'
import { printDayCosts } from './routes/cost-handler.ts'

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
		const costs = await getDailyCosts('EC2')
		console.log(printDayCosts(costs))
		const mtdCosts = await getMTDCost()
		const message =
			`From: ${mtdCosts?.TimePeriod?.Start} To: ${mtdCosts?.TimePeriod?.End}
		Total service used: ${toUSD(mtdCosts?.Total?.UnblendedCost)}
		Total tokens used: ${
				Number(mtdCosts?.Total?.UsageQuantity.Amount ?? 0) / 1000
			} mln tokens used `
		console.log('MTD cost:', message)
	},
})
