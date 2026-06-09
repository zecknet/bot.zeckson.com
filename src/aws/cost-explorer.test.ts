import '../config.local.ts'

import { getDailyCosts, getMTDCost } from './cost-explorer.ts'

Deno.test('CostExplorer', async () => {
	console.log('Daily costs:', await getDailyCosts())
	console.log('MTD cost:', await getMTDCost())
})
