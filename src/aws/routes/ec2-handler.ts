import { Instance } from '@aws-sdk/client-ec2'
import { Context, InlineKeyboard } from 'grammy'
import { getInstances, startInstance, stopInstance } from '../ec2.ts'

const format = (ins: Instance): string => {
	const nameTag = ins.Tags?.find((t) => t.Key === 'Name')?.Value
	const name = nameTag ? `*${nameTag}*` : '`unnamed`'
	const id = `\`${ins.InstanceId}\``
	const state = ins.State?.Name || 'unknown'
	const type = ins.InstanceType || 'unknown'
	return `${name} (${id})
	Type: ${type}
	State: ${state}
	Public IP: \`${ins.PublicIpAddress}\``
}
export const ec2Handler = async (ctx: Context) => {
	try {
		const instances = await getInstances()

		if (instances.length === 0) {
			await ctx.reply('No EC2 instances found.')
			return
		}

		for (const ins of instances) {
			const text = format(ins)
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
		await ctx.reply(
			`Failed to fetch EC2 instances: ${
				error instanceof Error ? error.message : String(error)
			}`,
		)
	}
}
export const callbackHandler = async (
	ctx: Context & { match: RegExpExecArray },
) => {
	const [, action, instanceId] = ctx.match
	try {
		await ctx.answerCallbackQuery({
			text: `${action === 'start' ? 'Starting' : 'Stopping'} instance...`,
		})

		let instance: Instance | undefined = undefined
		if (action === 'start') {
			instance = await startInstance(instanceId)
		} else {
			instance = await stopInstance(instanceId)
		}

		const stateName = action === 'start' ? 'starting' : 'stopping'
		let message = `Instance \`${instanceId}\` ${stateName}...`

		if (instance) {
			instance.State = {
				Name: action === 'start' ? 'pending' : 'stopping',
			}
			message = format(instance)
		}

		await ctx.editMessageText(
			message,
			{ parse_mode: 'Markdown', reply_markup: undefined },
		)
	} catch (error) {
		console.error(`EC2 ${action} Error:`, error)
		await ctx.reply(
			`Failed to ${action} instance: ${
				error instanceof Error ? error.message : String(error)
			}`,
		)
	}
}
