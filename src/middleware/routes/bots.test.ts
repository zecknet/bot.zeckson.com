import { assertEquals, assertRejects } from '@std/assert'
import { addBot, formatBotList } from './bots.ts'
import { BotRepository } from '../../repository/bot.repository.ts'
import { DenoStore } from '../../store/denostore.ts'

Deno.test('formatBotList', () => {
	const bots = [
		{
			token: 'token1',
			addedBy: 123,
			addedAt: Date.now(),
			name: 'Bot 1',
		},
		{
			token: 'token2',
			addedBy: 456,
			addedAt: Date.now(),
		},
	]

	const result = formatBotList(bots)
	assertEquals(result.text.includes('Managed bots:'), true)
	assertEquals(result.text.includes('token1 (added by 123) - Bot 1'), true)
	assertEquals(result.text.includes('token2 (added by 456)'), true)
	// Bold header + 2 code tokens
	assertEquals(result.entities.length, 3)
	assertEquals(result.entities[0].type, 'bold')
	assertEquals(result.entities[1].type, 'code')
	assertEquals(result.entities[2].type, 'code')
})

Deno.test('addBot - business logic', async () => {
	const kv = await Deno.openKv(':memory:')
	const store = new DenoStore(kv)
	const repo = new BotRepository(store)
	try {
		const botId = Math.floor(Math.random() * 1000000)
		const userId = 999
		const botName = 'New Bot'
		const token = 'secret_token'

		const managedBot = await addBot(botId, userId, botName, token, store)

		assertEquals(managedBot.name, botName)
		assertEquals(managedBot.token, token)
		assertEquals(managedBot.addedBy, userId)

		// Verify it's stored
		const stored = await repo.getBot(String(botId))
		assertEquals(stored, managedBot)

		// Try to add again - should fail
		await assertRejects(
			async () => {
				await addBot(botId, userId, botName, token, store)
			},
			Error,
			'This bot is already managed.',
		)
	} finally {
		store.close()
	}
})
