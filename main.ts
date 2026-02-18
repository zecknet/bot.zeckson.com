import './src/config.ts'
import { bot } from './src/bot.ts'

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
	try {
		await bot.start({
			onStart: (botInfo) => {
				console.log(
					`Telegram bot started: https://t.me/${botInfo.username}`,
				)
			},
		})
	} catch (err) {
		console.error(err)
	}
}
