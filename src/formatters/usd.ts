const FORMATTER = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
})

export const usd = (value = 0) => FORMATTER.format(value)
