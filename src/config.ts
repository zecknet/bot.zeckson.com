export interface Config {
	readonly BOT_TOKEN: string
	readonly DENO_KV_URL?: string
	readonly REPLICATE_API_TOKEN?: string
	readonly ADMIN_USER_IDS: string[]
	readonly ROOT_USER_ID: string
	readonly REPLICATE_WEBHOOK_SIGNING_SECRET?: string
	readonly BASE_URL?: string
}

const DEFAULT = {
	ADMIN_USER_IDS: [],
	PROJECT_ID: 'zeckson-finance-bot',
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

	const denoDeploymentId = env['DENO_DEPLOYMENT_ID']
	_config = Object.freeze({
		...DEFAULT,
		BOT_TOKEN: getEnv('BOT_TOKEN'),
		DENO_KV_URL: env['DENO_KV_URL'],
		REPLICATE_API_TOKEN: env['REPLICATE_API_TOKEN'],
		ADMIN_USER_IDS: adminUserIds,
		DENO_DEPLOYMENT_ID: denoDeploymentId,
		ROOT_USER_ID: adminUserIds[0],
		REPLICATE_WEBHOOK_SIGNING_SECRET: env['REPLICATE_WEBHOOK_SIGNING_SECRET'],
		BASE_URL: `https://${DEFAULT.PROJECT_ID}${
			denoDeploymentId ? `-${denoDeploymentId}` : ``
		}.deno.dev`,
	}) as Config

	return _config
}

export const config = new Proxy<Config>(
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
