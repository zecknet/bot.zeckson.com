import {
	DescribeInstancesCommand,
	EC2Client,
	Instance,
	StartInstancesCommand,
	StopInstancesCommand,
} from '@aws-sdk/client-ec2'
import { Composer, InlineKeyboard } from 'grammy'
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

export const getInstances = async (): Promise<Instance[]> => {
	const client = getEC2Client()
	const command = new DescribeInstancesCommand({})
	const response = await client.send(command)

	return response.Reservations?.flatMap(
		(r) => r.Instances || [],
	) || []
}

export const startInstance = async (instanceId: string) => {
	const client = getEC2Client()
	const command = new StartInstancesCommand({ InstanceIds: [instanceId] })
	return await client.send(command)
}

export const stopInstance = async (instanceId: string) => {
	const client = getEC2Client()
	const command = new StopInstancesCommand({ InstanceIds: [instanceId] })
	return await client.send(command)
}

aws.command('ec2', async (ctx) => {
	try {
		const instances = await getInstances();

		if (instances.length === 0) {
			await ctx.reply('No EC2 instances found.')
			return
		}

		for (const ins of instances) {
			const text = toString(ins)
			const keyboard = new InlineKeyboard()
			const state = ins.State?.Name
			const id = ins.InstanceId

			if (state === 'stopped') {
				keyboard.text('▶️ Start', `aws:start:${id}`)
			} else if (state === 'running') {
				keyboard.text('⏹️ Stop', `aws:stop:${id}`)
			}

			await ctx.reply(text, {
				parse_mode: 'Markdown',
				reply_markup: keyboard,
			})
		}
	} catch (error) {
		console.error('EC2 Error:', error)
		await ctx.reply(`Failed to fetch EC2 instances: ${error instanceof Error ? error.message : String(error)}`)
	}
})

aws.callbackQuery(/^aws:(start|stop):(.+)$/, async (ctx) => {
	const [, action, instanceId] = ctx.match
	try {
		await ctx.answerCallbackQuery({ text: `${action === 'start' ? 'Starting' : 'Stopping'} instance...` })

		if (action === 'start') {
			await startInstance(instanceId)
		} else {
			await stopInstance(instanceId)
		}

		await ctx.editMessageReplyMarkup({ reply_markup: undefined })
		await ctx.reply(`Instance \`${instanceId}\` ${action === 'start' ? 'starting' : 'stopping'}...`, { parse_mode: 'Markdown' })
	} catch (error) {
		console.error(`EC2 ${action} Error:`, error)
		await ctx.reply(`Failed to ${action} instance: ${error instanceof Error ? error.message : String(error)}`)
	}
})

export default aws
