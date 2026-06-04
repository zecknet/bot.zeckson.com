import { DescribeInstancesCommand, EC2Client, Instance } from '@aws-sdk/client-ec2'
import { Composer } from 'grammy'
import { config } from '../config.ts'

const aws = new Composer()

const getEC2Client = () => {
	const accessKeyId = config.AWS_ACCESS_KEY_ID
	const secretAccessKey = config.AWS_SECRET_ACCESS_KEY
	const region = config.AWS_REGION

	if (!accessKeyId || !secretAccessKey) {
		throw new Error('AWS credentials are not configured')
	}

	return new EC2Client({
		region,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	})
}

const toString = (ins: Instance): string => {
	const nameTag = ins.Tags?.find((t) => t.Key === 'Name')?.Value
	const name = nameTag ? `*${nameTag}*` : '`unnamed`'
	const id = `\`${ins.InstanceId}\``
	const state = ins.State?.Name || 'unknown'
	const type = ins.InstanceType || 'unknown'
	return `${name} (${id})\nType: ${type}\nState: ${state}`
}

export const getInstances = async (): Promise<string[]> => {
	const client = getEC2Client()
	const command = new DescribeInstancesCommand({})
	const response = await client.send(command)

	const instances = response.Reservations?.flatMap(
		(r) => r.Instances || [],
	) || []

	return instances
		.map(toString)
}


aws.command('ec2', async (ctx) => {
	try {
		const list = await getInstances();

		if (list.length === 0) {
			await ctx.reply('No EC2 instances found.')
		}

		await ctx.reply(`EC2 Instances:\n\n${list.join('\n\n')}`, { parse_mode: 'Markdown' })
	} catch (error) {
		console.error('EC2 Error:', error)
		await ctx.reply(`Failed to fetch EC2 instances: ${error instanceof Error ? error.message : String(error)}`)
	}
})

export default aws
