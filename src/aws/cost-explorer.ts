import {
	CostExplorerClient,
	Expression,
	GetCostAndUsageCommand,
	MetricValue,
	ResultByTime,
} from '@aws-sdk/client-cost-explorer'
import { getConfig } from './aws.config.ts'

export const COST_SERVICE_MAPPING = {
	'Amazon Bedrock': ['Amazon Bedrock'],
	'EC2': [
		'Amazon Elastic Compute Cloud - Compute', // Tracks literal per-second server instance runtime fees
		'EC2 - Other', // storage, ipv4, etc...
	],
} as const

// Optional: Create a type out of your map keys ('Amazon Bedrock' | 'EC2')
export type TrackedService = keyof typeof COST_SERVICE_MAPPING

export const costExplorer = () => new CostExplorerClient(getConfig())

// helper: format date YYYY-MM-DD
export const formatDate = (d: Date) => {
	return d.toISOString().split('T')[0]
}

export const toUSD = (value: MetricValue = { Amount: `0`, Unit: 'USD' }) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: value.Unit ?? 'USD',
	}).format(Number(value.Amount ?? 0))

/**
 * Builds a filter compound that targets a specific service while
 * explicitly filtering out any credit line items to show true gross usage.
 */
function createGrossCostFilter(services: string | string[]): Expression {
	// Ensure we handle both single strings (like Bedrock) and arrays (like EC2)
	const serviceValues = Array.isArray(services) ? services : [services]

	return {
		And: [
			{
				Dimensions: {
					Key: 'SERVICE',
					Values: serviceValues,
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
export type DayCost = { date: string; cost: string }

export const costToDay = (day: ResultByTime): DayCost => ({
	date: day.TimePeriod?.Start ?? `unknown`,
	cost: toUSD(day.Total?.UnblendedCost),
})

export const costToDays = (
	days: ResultByTime[],
): DayCost[] => days.map(costToDay)

// TODAY + LAST 7 DAYS COST (Excluding Credits)
export async function getDailyCosts(
	...services: TrackedService[]
): Promise<ResultByTime[]> {
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
		Filter: createGrossCostFilter(
			services.flatMap((service) => COST_SERVICE_MAPPING[service]),
		),
	})

	const explorerClient = costExplorer()
	try {
		const res = await explorerClient.send(command)
		return res.ResultsByTime ?? []
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
export async function getMTDCost(
	service = 'Amazon Bedrock',
): Promise<ResultByTime | undefined> {
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

	const explorerClient = costExplorer()
	try {
		const res = await explorerClient.send(command)
		const resultsByTime = res.ResultsByTime ?? []

		// FIX: Always pick the last item in the array to get the active month
		return resultsByTime[resultsByTime.length - 1]
	} finally {
		explorerClient.destroy()
	}
}
