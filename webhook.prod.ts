import './src/config.prod.ts'
import { config } from './src/config.ts'
import { install } from "./webhook.ts"

const DEPLOY_URL = config.BASE_URL
console.log(`Deno deploy url: ${DEPLOY_URL}`)

if (!DEPLOY_URL) {
    throw new Error('DEPLOY_URL is not set')
}

await install(DEPLOY_URL)



