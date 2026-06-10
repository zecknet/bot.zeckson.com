import '../config.local.ts'

import { getDailyCosts, getMTDCost } from './cost-explorer.ts'

Deno.test({
	name: 'CostExplorer',
	ignore: true,
	permissions: {
		read: true,
	},
	async fn() {
		console.log('Daily costs:', await getDailyCosts())
		console.log('MTD cost:', await getMTDCost())
	},
})
