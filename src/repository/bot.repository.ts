import { DenoStore } from '../store/denostore.ts'
import { config } from '../config.ts'

export interface ManagedBot {
    token: string
    addedBy: number
    addedAt: number
    name?: string
}

export class BotRepository {
    private constructor(private store: DenoStore) {}

    static async create(): Promise<BotRepository> {
        const kv = await (config.DENO_KV_URL ? Deno.openKv(config.DENO_KV_URL) : Deno.openKv())
        return new BotRepository(new DenoStore(kv))
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
        return entries.map(entry => entry.value as ManagedBot)
    }
}
