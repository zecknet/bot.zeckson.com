import { assertEquals, assertRejects } from "@std/assert";
import { BotRepository } from "../repository/bot.repository.ts";
import { addBot } from "../middleware/bots.ts";
import { config, initConfig } from "../config.ts";
import { DenoStore } from "../store/denostore.ts";

// Initialize config for tests
try {
    initConfig({
        BOT_TOKEN: "test_token",
        ADMIN_USER_IDS: "123",
    });
} catch (_e) {
    // Config might be already initialized in some environments
}

Deno.test("addBot - business logic", async () => {
    const kv = await Deno.openKv(":memory:");
    const store = new DenoStore(kv);
    const repo = new BotRepository(store);
    try {
        const botId = Math.floor(Math.random() * 1000000);
        const userId = 999;
        const botName = "New Bot";
        const token = "secret_token";

        const managedBot = await addBot(botId, userId, botName, token, store);

        assertEquals(managedBot.name, botName);
        assertEquals(managedBot.token, token);
        assertEquals(managedBot.addedBy, userId);

        // Verify it's stored
        const stored = await repo.getBot(String(botId));
        assertEquals(stored, managedBot);

        // Try to add again - should fail
        await assertRejects(
            async () => {
                await addBot(botId, userId, botName, token, store);
            },
            Error,
            "This bot is already managed."
        );
    } finally {
        store.close();
    }
});
