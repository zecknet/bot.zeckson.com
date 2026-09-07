interface MetricValue {
	Amount?: string
	Unit?: string
}

export const toCurrency = (value: MetricValue = { Amount: `0`, Unit: 'USD' }) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: value.Unit ?? 'USD',
	}).format(Number(value.Amount ?? 0))

