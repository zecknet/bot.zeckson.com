import { rate as exchangeRate } from './finance.math.ts'
import { Currency } from './finance.type.ts'
import { rate } from '../formatters/rate.ts'
import { roubles } from '../formatters/rouble.ts'
import { rupees } from '../formatters/rupiee.ts'
import { usdt } from '../formatters/usdt.ts'

export class Markdown {
	static rate(given: Currency, received: Currency): string {
		return rate(exchangeRate(given, received))
	}
	static roubles2usdt(given: Currency, received: Currency): string {
		const result = exchangeRate(given, received)
		return `Поменял: ${roubles(given)} (${usdt(received)}). Курс: **${
			rate(result)
		}**`
	}
	static usdt2lkr(given: Currency, received: Currency): string {
		const result = exchangeRate(received, given)
		return `Обмен USDT -> LKR: ${usdt(given)} (${
			rupees(received)
		}). Курс: **${rate(result)}**`
	}
	static roubles2lkr(given: Currency, received: Currency): string {
		const result = exchangeRate(received, given)
		return `Обмен RUB -> LKR (c учётом всех комиссий): ${
			roubles(given)
		} -> ${rupees(received)}. Курс: **${rate(result)}**`
	}
	static sent(sent: Currency, commission: Currency = 1): string {
		return `Отправил: **${usdt(sent)}** (+${
			usdt(commission)
		} commission) = **${usdt(sent + commission)}**`
	}
}
