import '../config.local.ts'
import { getDailyCosts, getMTDCost } from './cost-explorer.ts'

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
		const costs = await getDailyCosts()
		console.log('Daily costs:', costs?.map(it => `${it.date}: ${it.cost}`).join('\n'))
		const mtdCosts = await getMTDCost()
		console.log('MTD cost:', mtdCosts)
	},
})
