import { assertEquals } from '@std/assert'
import { DenoStore } from '../store/denostore.ts'
import { BotRepository } from './bot.repository.ts'

const openStore = () => {
	return Deno.openKv(':memory:')
}

Deno.test({
	name: 'BotRepository - save and get bot',
}, async () => {
	const kv = await openStore()
	const store = new DenoStore(kv)
	const repo = new BotRepository(store)
	try {
		const botId = '123456'
		const botData = {
			token: 'bot_token',
			addedBy: 789,
			addedAt: Date.now(),
			name: 'Test Bot',
		}

		await repo.saveBot(botId, botData)
		const retrieved = await repo.getBot(botId)

		assertEquals(retrieved, botData)
	} finally {
		store.close()
	}
})

Deno.test('BotRepository - list bots', async () => {
	const kv = await openStore()
	const store = new DenoStore(kv)
	const repo = new BotRepository(store)
	try {
		const botId1 = 'bot1'
		const botId2 = 'bot2'

		const bot1 = {
			token: 't1',
			addedBy: 1,
			addedAt: Date.now(),
			name: 'B1',
		}
		const bot2 = {
			token: 't2',
			addedBy: 2,
			addedAt: Date.now(),
			name: 'B2',
		}

		await repo.saveBot(botId1, bot1)
		await repo.saveBot(botId2, bot2)

		const list = await repo.listBots()

		// We search for our bots because there might be other bots in the KV
		const found1 = list.find((b) => b.token === 't1')
		const found2 = list.find((b) => b.token === 't2')

		assertEquals(found1, bot1)
		assertEquals(found2, bot2)
	} finally {
		store.close()
	}
})
