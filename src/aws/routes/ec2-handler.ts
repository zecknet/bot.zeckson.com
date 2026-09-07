import { Instance } from '@aws-sdk/client-ec2'
import { Context, InlineKeyboard } from 'grammy'
import { fmt, FormattedString } from '@grammyjs/parse-mode'
import { getInstances, startInstance, stopInstance } from '../ec2.ts'

export const format = (ins: Instance) => {
	const nameTag = ins.Tags?.find((t) => t.Key === 'Name')?.Value
	const name = nameTag ? FormattedString.bold(nameTag) : FormattedString.italic('unnamed')
	const id = FormattedString.code(ins.InstanceId || 'unknown')
	const state = ins.State?.Name || 'unknown'
	const type = ins.InstanceType || 'unknown'

	let stateEmoji = '🟡'
	if (state === 'running') stateEmoji = '🟢'
	else if (state === 'stopped') stateEmoji = '🔴'

	return fmt`${name} (${id})
Type: ${type}
State: ${stateEmoji} ${state}
Public IP: ${FormattedString.code(ins.PublicIpAddress || 'none')}`
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

			await ctx.reply(text.text, {
				entities: text.entities,
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
		let message = fmt`Instance ${FormattedString.code(instanceId)} ${stateName}...`

		if (instance) {
			instance.State = {
				Name: action === 'start' ? 'pending' : 'stopping',
			}
			message = format(instance)
		}

		await ctx.editMessageText(
			message.text,
			{
				entities: message.entities,
				reply_markup: undefined,
			},
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
