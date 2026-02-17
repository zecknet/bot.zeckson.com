import { Composer } from 'grammy'
import { config } from '../config.ts'

const approvedIds = config.ADMIN_USER_IDS

const replicate = new Composer()

replicate.command('bot', async (ctx) => {
	const userId = ctx.from?.id.toString()
	if (!userId || !approvedIds.includes(userId)) {
		console.log(`Unauthorized access attempt by user: ${userId}`)
		return
	}

	const prompt = ctx.match
	if (!prompt) {
		await ctx.reply('Please provide a prompt, e.g. /bot Hello')
		return
	}

	if (!config.REPLICATE_API_TOKEN) {
		await ctx.reply('Replicate API token is not configured.')
		return
	}

	const businessConnectionId = ctx.businessConnectionId

	if (businessConnectionId) {
		console.log(`Command /bot received in business connection: ${businessConnectionId}`)
	}

	try {
		// Using a popular model like meta/meta-llama-3-70b-instruct
		const response = await fetch(
			'https://api.replicate.com/v1/predictions',
			{
				method: 'POST',
				headers: {
					Authorization: `Token ${config.REPLICATE_API_TOKEN}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					// meta-llama-3-70b-instruct
					version:
						'711efc34e86abccf9a62d061738ecdcea4a7690623631f4a9b708d752c0836ed',
					input: {
						prompt: prompt,
					},
				}),
			},
		)

		if (!response.ok) {
			const error = await response.text()
			console.error('Replicate API error:', error)
			await ctx.reply('Failed to get answer from Replicate.')
			return
		}

		let prediction = await response.json()

		// Poll for result
		while (
			prediction.status !== 'succeeded' &&
			prediction.status !== 'failed' &&
			prediction.status !== 'canceled'
		) {
			await new Promise((resolve) => setTimeout(resolve, 1000))
			const pollResponse = await fetch(prediction.urls.get, {
				headers: {
					Authorization: `Token ${config.REPLICATE_API_TOKEN}`,
				},
			})
			prediction = await pollResponse.json()
		}

		if (prediction.status === 'succeeded') {
			const output = Array.isArray(prediction.output)
				? prediction.output.join('')
				: prediction.output
			await ctx.reply(output, {
				business_connection_id: businessConnectionId,
			})
		} else {
			await ctx.reply(`Prediction failed with status: ${prediction.status}`, {
				business_connection_id: businessConnectionId,
			})
		}
	} catch (error) {
		console.error('Error in /bot command:', error)
		await ctx.reply('An error occurred while processing your request.', {
			business_connection_id: businessConnectionId,
		})
	}
})

export default replicate
