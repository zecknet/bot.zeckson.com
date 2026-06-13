import { EC2ClientConfig } from "@aws-sdk/client-ec2"
import { config } from '../config.ts'

export const getConfig = (extra: object = {}): EC2ClientConfig => {
	const result = {
		region: config.AWS_REGION!,
		credentials: {
			accessKeyId: config.AWS_ACCESS_KEY_ID!,
			secretAccessKey: config.AWS_SECRET_ACCESS_KEY!,
		},
		...extra,
	}

	const credentials = result.credentials
	if (!credentials.accessKeyId || !credentials.secretAccessKey) {
		throw new Error('AWS credentials are not configured')
	}

	return result
}
