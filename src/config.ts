export interface Config {
	readonly BOT_TOKEN: string
	readonly DENO_KV_URL?: string
	readonly REPLICATE_API_TOKEN?: string
	readonly ADMIN_USER_IDS: string[]
	readonly ROOT_USER_ID: string
	readonly REPLICATE_WEBHOOK_SIGNING_SECRET?: string
	readonly BASE_URL?: string
	readonly AWS_ACCESS_KEY_ID?: string
	readonly AWS_SECRET_ACCESS_KEY?: string
	readonly AWS_REGION?: string
}

const DEFAULT = {
	ADMIN_USER_IDS: [],
}

let _config: Config | undefined

export const initConfig = (env: Record<string, string>): Config => {
	const getEnv = (key: string, defaultValue?: string): string => {
		const value = env[key] || defaultValue
		if (value === undefined) {
			throw new Error(`Environment variable ${key} is required`)
		}
		return value
	}

	const getEnvArray = (
		key: string,
		defaultValue: string[] = [],
	): string[] => {
		const value = env[key]
		if (!value) return defaultValue
		return value.split(',').map((id) => id.trim()).filter(Boolean)
	}

	const adminUserIds = getEnvArray('ADMIN_USER_IDS')

	const isDeploy = env['DENO_DEPLOY'] === 'true'

	const buildId = env['DENO_DEPLOY_BUILD_ID']
	const suffix = buildId ? `-${buildId}` : ``

	const host = isDeploy
		? `https://${env['DENO_DEPLOY_APP_SLUG']}${suffix}.${
			env['DENO_DEPLOY_ORG_SLUG']
		}.deno.net`
		: undefined

	_config = Object.freeze({
		...DEFAULT,
		BOT_TOKEN: getEnv('BOT_TOKEN'),
		DENO_KV_URL: env['DENO_KV_URL'],
		REPLICATE_API_TOKEN: env['REPLICATE_API_TOKEN'],
		ADMIN_USER_IDS: adminUserIds,
		ROOT_USER_ID: adminUserIds[0],
		REPLICATE_WEBHOOK_SIGNING_SECRET:
			env['REPLICATE_WEBHOOK_SIGNING_SECRET'],
		BASE_URL: host,
		AWS_ACCESS_KEY_ID: env['AWS_ACCESS_KEY_ID'],
		AWS_SECRET_ACCESS_KEY: env['AWS_SECRET_ACCESS_KEY'],
		AWS_REGION: env['AWS_REGION'] || 'us-east-1',
	}) as Config

	return _config
}

export const config: Config = new Proxy<Config>(
	{} as Config & { get<K extends keyof Config>(key: K): Config[K] },
	{
		get(_target, prop, _receiver) {
			if (prop === 'get') {
				return <K extends keyof Config>(key: K): Config[K] => {
					return getConfig()[key]
				}
			}
			return getConfig()[prop as keyof Config]
		},
	},
)

const getConfig = (): Config => {
	if (!_config) {
		throw new Error('Config not initialized. Call initConfig() first.')
	}
	return _config
}
