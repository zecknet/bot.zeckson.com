import './src/config.prod.ts'
import { handleWebhook, setWebhook } from './server.deno.ts'
import { bot } from './src/bot.ts'
import { config } from './src/config.ts'
import ServerResponse from './src/server/response.ts'

const DEPLOY_URL = config.BASE_URL

const hello = (req: Request) =>
	ServerResponse.text(
		`Hello World!\nRequest url: ${req.url}\n`,
	)

Deno.serve(async (req) => {
	const start = Date.now()
	let response = hello(req)
	try {
		const webhookResponse = await handleWebhook(req)
		response = webhookResponse ?? response
	} finally {
		console.debug(
			`${req.method} ${req.url} - ${response.status} "${response.type}" in ${
				Date.now() - start
			}ms`,
		)
	}

	return response
})

console.log(`Deno deploy url: ${DEPLOY_URL}`)

if (DEPLOY_URL) {
	await setWebhook(`${DEPLOY_URL}/${bot.token}`)
}

