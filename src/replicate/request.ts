import Replicate from 'replicate'
import { config } from '../config.ts'

type Response = {
	status: 'done'
	data: string
} | {
	status: 'error'
	errorMessage: string
}

const client = new Replicate({
	auth: config.REPLICATE_API_TOKEN,
})

const DEFAULT_MODEL = 'google/gemini-3-pro'
const DEFAULT_OPTIONS = {
	input: {
		top_p: 0.95,
		images: [],
		videos: [],
		temperature: 1,
		thinking_level: 'low',
		max_output_tokens: 32000,
	},
}

export const request = async (prompt: string) => {
	const options = {
		...DEFAULT_OPTIONS,
		input: { ...DEFAULT_OPTIONS.input, prompt },
	}

	console.log('Replicate request:', options)

	try {
		const output = await client.run(
			DEFAULT_MODEL,
			options,
		)

		const result = Array.isArray(output) ? output.join('') : output

		return { status: 'done', data: result as string }
	} catch (error: unknown) {
		console.error('Error in replicate request:', error)

		let errorMessage = 'An error occurred while processing your request.'

		const err = error as { status?: number; retry_after?: number }
		if (err.status === 429) {
			const retryAfter = err.retry_after || 0
			errorMessage =
				`⚠️ Replicate rate limit exceeded. Please try again later${
					retryAfter ? ` (in ~${retryAfter}s)` : ''
				}.`
		} else if (err.status) {
			errorMessage = `⚠️ Replicate API returned error ${err.status}.`
		}

		return { status: 'error', errorMessage }
	}
}
