import { config } from '../config.ts'

export const getConfig = () => ({
	region: config.AWS_REGION!,
	credentials: {
		accessKeyId: config.AWS_ACCESS_KEY_ID!,
		secretAccessKey: config.AWS_SECRET_ACCESS_KEY!,
	},
})
