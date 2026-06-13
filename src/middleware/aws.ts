import { Instance, } from '@aws-sdk/client-ec2'
import { Composer, Context, InlineKeyboard } from 'grammy'
import { getInstances, startInstance, stopInstance } from "../aws/ec2.ts"
import { CommandComposer } from '../util/commands.ts'

const aws = new Composer<Context>() as CommandComposer<Context>

const EC2 = { command: 'ec2', description: 'Manage AWS EC2 instances' }

aws.commands = [
	EC2,
]

const format = (ins: Instance): string => {
	const nameTag = ins.Tags?.find((t) => t.Key === 'Name')?.Value
	const name = nameTag ? `*${nameTag}*` : '`unnamed`'
	const id = `\`${ins.InstanceId}\``
	const state = ins.State?.Name || 'unknown'
	const type = ins.InstanceType || 'unknown'
	return `${name} (${id})\nType: ${type}\nState: ${state}`
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

aws.command(EC2.command, ec2Handler)

export const callbackHandler = async (
	ctx: Context & { match: RegExpExecArray },
) => {
	const [, action, instanceId] = ctx.match
	try {
		await ctx.answerCallbackQuery({
			text: `${action === 'start' ? 'Starting' : 'Stopping'} instance...`,
		})

		if (action === 'start') {
			await startInstance(instanceId)
		} else {
			await stopInstance(instanceId)
		}

		await ctx.editMessageReplyMarkup({ reply_markup: undefined })
		await ctx.reply(
			`Instance \`${instanceId}\` ${
				action === 'start' ? 'starting' : 'stopping'
			}...`,
			{ parse_mode: 'Markdown' },
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

aws.callbackQuery(
	/^aws:(start|stop):(.+)$/,
	callbackHandler as unknown as (ctx: Context) => Promise<void>,
)

export default aws
