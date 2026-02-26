import { initConfig } from "./config"

const env = Deno.env.toObject()

initConfig(env)
