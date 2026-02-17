import { handleWebhook, setWebhook } from './server.deno.ts'
import { bot } from './src/bot.ts'
import { config } from "./src/config.ts"

const DEPLOY_URL = `https://${config.PROJECT_ID}${
	config.DENO_DEPLOYMENT_ID ? `-${config.DENO_DEPLOYMENT_ID}` : ``
}.deno.dev`

const hello = (req: Request) =>
	new Response(
		`Hello World!\nRequest url: ${req.url}\nDeploy url: ${DEPLOY_URL}`,
		{
			headers: { 'content-type': 'text/plain' },
		},
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

await setWebhook(`${DEPLOY_URL}/${bot.token}`)

console.log(`Deno deploy url: ${DEPLOY_URL}`)
