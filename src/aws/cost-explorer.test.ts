import { getDailyCosts, getMTDCost } from './cost-explorer.ts'

Deno.test({
	name: 'CostExplorer',
	ignore: true,
	permissions: {
		read: true,
		env: true,
		sys: true,
	},
	async fn() {
		await import('../config.local.ts')
		console.log('Daily costs:', await getDailyCosts())
		console.log('MTD cost:', await getMTDCost())
	},
})
