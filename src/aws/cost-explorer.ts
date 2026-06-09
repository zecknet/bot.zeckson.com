import '../config.local.ts'

import { CostExplorerClient, GetCostAndUsageCommand, GetCostForecastCommand, } from '@aws-sdk/client-cost-explorer'
import { getConfig } from './aws.config.ts'

const client = new CostExplorerClient(getConfig())

// helper: format date YYYY-MM-DD
function formatDate(d: Date) {
	return d.toISOString().split('T')[0]
}

const toUSD = (value: number) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(value)

// TODAY + LAST 7 DAYS COST
export async function getDailyCosts() {
	const end = new Date()
	const start = new Date()
	start.setDate(end.getDate() - 7)

	const command = new GetCostAndUsageCommand({
		TimePeriod: {
			Start: formatDate(start),
			End: formatDate(end),
		},
		Granularity: 'DAILY',
		Metrics: ['UnblendedCost'],
	})

	const res = await client.send(command)

	return res.ResultsByTime?.map((day) => ({
		date: day.TimePeriod?.Start,
		cost: toUSD(parseInt(day.Total?.UnblendedCost.Amount ?? ``, 10)),
	}))
}

// FORECAST (next 30 days)
export async function getForecast() {
	const start = new Date()
	const end = new Date()
	end.setDate(start.getDate() + 1)

	const command = new GetCostForecastCommand({
		TimePeriod: {
			Start: formatDate(start),
			End: formatDate(end),
		},
		Metric: 'UNBLENDED_COST',
		Granularity: 'DAILY',
	})

	const res = await client.send(command)

	return {
		predictedTomorrow: res.Total?.Amount,
		unit: res.Total?.Unit,
	}
}
