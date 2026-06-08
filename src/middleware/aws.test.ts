import { getInstances } from './aws.ts'

Deno.test({
    name: 'get instances',
    ignore: true,
    permissions: {
        env: true,
    }
}, async () => {
    // await import(`../config.local.ts`)
    console.log(await getInstances())
})
