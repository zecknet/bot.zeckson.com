import { DenoStore } from '../store/denostore.ts'

export interface ManagedBot {
	token: string
	addedBy: number
	addedAt: number
	name?: string
}

export class BotRepository {
	constructor(private store: DenoStore) {
	}

	async saveBot(botId: string, bot: ManagedBot): Promise<void> {
		const botKey = ['managed_bot', botId]
		await this.store.save(botKey, bot)
	}

	async getBot(botId: string): Promise<ManagedBot | null> {
		const botKey = ['managed_bot', botId]
		const entry = await this.store.load<ManagedBot>(botKey)
		return entry.value
	}

	async listBots(): Promise<ManagedBot[]> {
		const entries = await this.store.list({ prefix: ['managed_bot'] })
		return entries.map((entry) => entry.value as ManagedBot)
	}
}
