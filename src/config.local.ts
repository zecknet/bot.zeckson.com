import '@std/dotenv/load'
import { initConfig } from "./config.ts"

const env = Deno.env.toObject()

initConfig(env)
