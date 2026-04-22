import { Composer, Context } from 'grammy'
import { config } from '../config.ts'
import { request } from '../replicate/request.ts'

const replicate = new Composer()

replicate.on('business_message', (ctx, next) => {
	const message = ctx.businessMessage
	const msg = message?.text

	if (msg && msg.startsWith('/bot ')) {
		return executeBotCommand(ctx, msg.replace('/bot ', ''))
	}

	return next()
})

replicate.on('message', (ctx, next) => {
	const message = ctx.message
	const msg = message?.text

	if (msg) {
		if (msg.startsWith('/')) {
			return next()
		}

		return executeBotCommand(ctx, msg)
	}

	return next()
})

const executeBotCommand = async (
	ctx: Context,
	prompt: string,
) => {
	const businessConnectionId = ctx.businessConnectionId
	let targetThreadId = ctx.message?.message_thread_id

	if (ctx.from?.id === Number(config.ROOT_USER_ID)) {
		console.log(
			`Running /bot command under ROOT_USER_ID. Ignoring business connection ID: ${businessConnectionId}`,
		)
	} else {
		ctx.reply('Господин запретил мне общаться с простолюдинами', {
			business_connection_id: businessConnectionId,
		})
		return
	}

	if (!prompt) {
		await ctx.reply('Please provide a prompt, e.g. /bot Hello', {
			business_connection_id: businessConnectionId,
		})
		return
	}

	if (!config.REPLICATE_API_TOKEN) {
		await ctx.reply('Replicate API token is not configured.', {
			business_connection_id: businessConnectionId,
		})
		return
	}

	if (businessConnectionId) {
		console.log(
			`Command /bot received in business connection: ${businessConnectionId}`,
		)
	}

	if (!targetThreadId && ctx.chat) {
		console.log('No target thread ID found. Get Thread name from prompt')
		const response = await request(`Get Thread name from prompt in one word: ${prompt}`)
		if (response.status === 'error') {
			return ctx.reply(response.errorMessage ?? `Error: ${response.status}`)
		}
		const topic = await ctx.api.createForumTopic(
			ctx.chat.id,
			response.data ?? 'Unknown',
		)
		targetThreadId = topic.message_thread_id
	}

	const response = await request(prompt)

	return ctx.reply(response.data ?? response.errorMessage, {
		message_thread_id: targetThreadId,
	})
}
replicate.command('bot', (ctx) => executeBotCommand(ctx, ctx.match))

export default replicate
