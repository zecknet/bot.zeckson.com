import './src/config.prod.ts'
import { handleWebhook, setWebhook } from './server.deno.ts'
import { bot } from './src/bot.ts'
import { store } from './src/middleware/store.ts'
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
	const key = [`deploy_url`, DEPLOY_URL]
	const deploymentData = await store.load(key)

	if (deploymentData) {
		console.log(`Webhook ${DEPLOY_URL} is already set`)
	} else {
		const path = `${DEPLOY_URL}/${bot.token}`
		console.log(`Setting webhook ${path}`)
		await setWebhook(path)
		await store.set(key, true)
	}
}

