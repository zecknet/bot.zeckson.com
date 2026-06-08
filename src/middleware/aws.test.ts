import { initConfig } from "../config.ts"
import { getInstances } from './aws.ts'

// Mock config for testing
initConfig({
    ADMIN_USER_IDS: '12345',
    BOT_TOKEN: 'test_token',
})

Deno.test({
    name: 'get instances',
    ignore: true,
    permissions: {
        env: true,
    }
}, async () => {
    console.log(await getInstances())
})
