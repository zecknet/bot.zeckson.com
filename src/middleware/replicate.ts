import { Composer, Context } from 'grammy'
import Replicate from 'replicate'
import { config } from '../config.ts'

const replicate = new Composer()

const client = new Replicate({
	auth: config.REPLICATE_API_TOKEN,
})

replicate.on('business_message', (ctx, next) => {
	const message = ctx.businessMessage
	const msg = message?.text

	if (msg && msg.startsWith('/bot ')) {
		ctx.match = msg.replace('/bot ', '')
		return executeBotCommand(ctx)
	}

	return next()
})

const executeBotCommand = async (ctx: Context) => {
	const prompt = ctx.match
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

	try {
		const input = {
			top_p: 0.95,
			images: [],
			prompt: prompt,
			videos: [],
			temperature: 1,
			thinking_level: 'low',
			max_output_tokens: 32000,
		}

		const output = await client.run(
			'google/gemini-3-pro',
			{
				input: input,
			},
		)
		// Using a popular model like meta/meta-llama-3-70b-instruct
		const result = Array.isArray(output) ? output.join('') : output
		await ctx.reply(result as string, {
			business_connection_id: businessConnectionId,
		})
	} catch (error: any) {
		console.error('Error in /bot command:', error)

		let errorMessage = 'An error occurred while processing your request.'

		if (error.status === 429) {
			const retryAfter = error.retry_after || 0
			errorMessage =
				`⚠️ Replicate rate limit exceeded. Please try again later${
					retryAfter ? ` (in ~${retryAfter}s)` : ''
				}.`
		} else if (error.status) {
			errorMessage = `⚠️ Replicate API returned error ${error.status}.`
		}

		await ctx.reply(errorMessage, {
			business_connection_id: businessConnectionId,
		})
	}
}
replicate.command('bot', executeBotCommand)

export default replicate
