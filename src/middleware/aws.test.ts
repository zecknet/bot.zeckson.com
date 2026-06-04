import { getInstances } from './aws.ts'
import '../config.local.ts'

console.log(await getInstances())
