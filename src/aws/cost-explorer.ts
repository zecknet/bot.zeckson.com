import {
	CostExplorerClient, Expression,
	GetCostAndUsageCommand,
	MetricValue,
} from '@aws-sdk/client-cost-explorer'
import { getConfig } from './aws.config.ts'

const client = () => new CostExplorerClient(getConfig())

// helper: format date YYYY-MM-DD
function formatDate(d: Date) {
	return d.toISOString().split('T')[0]
}

const toUSD = (value: MetricValue = { Amount: `0`, Unit: 'USD' }) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: value.Unit ?? 'USD',
	}).format(Number(value.Amount ?? 0))

/**
 * Builds a filter compound that targets a specific service while
 * explicitly filtering out any credit line items to show true gross usage.
 */
function createGrossCostFilter(service: string): Expression  {
	return {
		And: [
			{
				Dimensions: {
					Key: 'SERVICE',
					Values: [service],
				},
			},
			{
				Not: {
					Dimensions: {
						Key: 'RECORD_TYPE',
						Values: ['Credit'],
					},
				},
			},
		],
	}
}

// TODAY + LAST 7 DAYS COST (Excluding Credits)
export async function getDailyCosts(service = 'Amazon Bedrock') {
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
		Filter: createGrossCostFilter(service),
	})

	const explorerClient = client()
	try {
		const res = await explorerClient.send(command)
		return res.ResultsByTime?.map((day) => ({
			date: day.TimePeriod?.Start,
			cost: toUSD(day.Total?.UnblendedCost),
		}))
	} finally {
		explorerClient.destroy()
	}
}

function getMonthRange() {
	const now = new Date()

	const start = new Date(now.getFullYear(), now.getMonth(), 1)
	const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

	return {
		Start: formatDate(start),
		End: formatDate(end),
	}
}

// MONTH TO DATE COST (Excluding Credits)
export async function getMTDCost(service = 'Amazon Bedrock') {
	const command = new GetCostAndUsageCommand({
		TimePeriod: getMonthRange(),
		Granularity: 'MONTHLY',
		Metrics: [
			'UnblendedCost',
			'BlendedCost',
			'NetUnblendedCost',
			'AmortizedCost',
			'NetAmortizedCost',
			'UsageQuantity',
		],
		Filter: createGrossCostFilter(service),
	})

	const explorerClient = client()
	try {
		const res = await explorerClient.send(command)
		const resultsByTime = res.ResultsByTime ?? []
		return resultsByTime[0]?.Total
	} finally {
		explorerClient.destroy()
	}
}
