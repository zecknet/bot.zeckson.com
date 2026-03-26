import './src/config.prod.ts'
import { setWebhook } from './server.deno.ts'
import { bot } from './src/bot.ts'
import { config } from './src/config.ts'
import { store } from './src/middleware/store.ts'

const DEPLOY_URL = config.BASE_URL
console.log(`Deno deploy url: ${DEPLOY_URL}`)

if (!DEPLOY_URL) {
    throw new Error('DEPLOY_URL is not set')
}

const key = [`deploy_url`, DEPLOY_URL]
const deploymentData = await store.load(key)

if (deploymentData.value === DEPLOY_URL) {
    console.log(`Webhook ${DEPLOY_URL} is already set`)
} else {
    // Save
    await setWebhook(`${DEPLOY_URL}/${bot.token}`)
    await store.save(key, DEPLOY_URL)
}

