import { Composer } from 'grammy'

const topics = new Composer()

// Handle Forum Topic Created
topics.on('message:forum_topic_created', async (ctx) => {
	const { name, icon_custom_emoji_id } =
		ctx.message.forum_topic_created
	await ctx.reply(
		`New topic created: ${name}${
			icon_custom_emoji_id ? ` (Emoji: ${icon_custom_emoji_id})` : ''
		}`,
	)
})

// Example command that only works in a specific topic (if needed)
// Or just general handling of topic-related messages
topics.command('topic', async (ctx) => {
	const threadId = ctx.message?.message_thread_id
	if (threadId) {
		await ctx.reply(`This message is in a topic with ID: ${threadId}`)
	} else {
		await ctx.reply('This message is not in a topic.')
	}
})

topics.on('message', async (ctx, next) => {
	if (ctx.message.message_thread_id) {
		console.debug(
			`Message in topic (thread_id: ${ctx.message.message_thread_id})`,
		)
	}
	await next()
})

export default topics
