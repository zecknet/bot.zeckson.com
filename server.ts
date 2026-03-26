import './src/config.prod.ts'
import { handleWebhook } from './server.deno.ts'
import ServerResponse from './src/server/response.ts'

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
