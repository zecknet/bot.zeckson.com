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

const executeBotCommand = async (ctx: Context, prompt: string) => {
	const businessConnectionId = ctx.businessConnectionId

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

	const response = await request(prompt)

	await ctx.reply(response.data ?? response.errorMessage)
}
replicate.command('bot', (ctx) => executeBotCommand(ctx, ctx.match))

export default replicate
