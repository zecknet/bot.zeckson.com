export class DenoStore {
	constructor(private db: Deno.Kv) {
	}

	async save<T>(key: Deno.KvKey, data: T): Promise<boolean> {
		const result = await this.db.set(key, data)
		return result.ok
	}

	async load<T>(key: Deno.KvKey): Promise<Deno.KvEntryMaybe<T>> {
		return await this.db.get(key)
	}

	async list(selector: Deno.KvListSelector): Promise<Deno.KvEntry<object>[]> {
		return await Array.fromAsync(this.db.list(selector))
	}

	close() {
		this.db.close()
	}
}
