import { getDailyCosts } from "./cost-explorer.ts"

Deno.test('CostExplorer', async () => {
	console.log('Daily costs:', await getDailyCosts())
})
