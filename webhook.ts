import { setWebhook } from './server.deno.ts'
import { bot } from './src/bot.ts'

export const install = (baseUrl: string) => {
    if (!baseUrl) throw new Error('baseUrl is not set')

    return setWebhook(`${baseUrl}/${bot.token}`)
}


