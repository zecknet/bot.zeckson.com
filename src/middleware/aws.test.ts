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
        net: true,
    }
}, async () => {
    try {
        const instances = await getInstances()
        console.log('Instances:', instances)
    } catch (e) {
        console.log('Caught expected error or actual error:', e instanceof Error ? e.message : String(e))
    }
})
