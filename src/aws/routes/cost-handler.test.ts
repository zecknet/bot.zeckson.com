import { assertEquals } from 'jsr:@std/assert'
import { formatTokenUsageRaw, printDayCosts } from './cost-handler.ts'
import { ResultByTime } from '@aws-sdk/client-cost-explorer'
import { DailyTokenData } from '../bedrock-usage.ts'

Deno.test('cost-handler printDayCosts: multiple days', () => {
	const mockPeriod: ResultByTime[] = [
		{
			TimePeriod: { Start: '2023-01-01', End: '2023-01-02' },
			Total: { UnblendedCost: { Amount: '1.23', Unit: 'USD' } },
		},
		{
			TimePeriod: { Start: '2023-01-02', End: '2023-01-03' },
			Total: { UnblendedCost: { Amount: '4.56', Unit: 'USD' } },
		},
	]

	const result = printDayCosts(mockPeriod)
	// Columnar alignment: cost is padded to 9 chars in my implementation
	// "2023-01-01:     $1.23"
	// "2023-01-02:     $4.56"
	assertEquals(result.text.includes('2023-01-01:     $1.23'), true)
	assertEquals(result.text.includes('2023-01-02:     $4.56'), true)
	assertEquals(result.entities[0].type, 'pre')
})

Deno.test('cost-handler formatTokenUsageRaw: with data', () => {
	const mockData: DailyTokenData = {
		date: '2023-01-01',
		totalTokens: 3500,
		breakdown: [
			{ usageType: 'ModelA', tokenCount: 1000 },
			{ usageType: 'ModelB', tokenCount: 2500 },
		],
	}

	const result = formatTokenUsageRaw(mockData)
	assertEquals(result.text.includes('Date: 2023-01-01'), true)
	assertEquals(result.text.includes('Total Daily Tokens: 3,500'), true)
	assertEquals(result.text.includes('ModelA:      1,000'), true)
	assertEquals(result.text.includes('ModelB:      2,500'), true)
	
	// bold, code, bold, code, bold, pre
	assertEquals(result.entities.some(e => e.type === 'pre'), true)
})

Deno.test('cost-handler formatTokenUsageRaw: empty data', () => {
	const mockData: DailyTokenData = {
		date: '2023-01-01',
		totalTokens: 0,
		breakdown: [],
	}

	const result = formatTokenUsageRaw(mockData)
	assertEquals(result.text.includes('No active usage recorded for this day.'), true)
	assertEquals(result.entities.some(e => e.type === 'italic'), true)
})
