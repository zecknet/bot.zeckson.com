import { assert } from '@std/assert'
import { Context } from "grammy";
import { config } from "../config.ts";
import { auth } from "./auth.ts";

// Mock config for testing
config.ADMIN_USER_IDS = ["12345"];

Deno.test("auth middleware allows admin", async () => {
    let nextCalled = false;
    const ctx = {
        from: { id: 12345 },
        next: () => {
            nextCalled = true;
        }
    } as unknown as Context;

    await auth(ctx, async () => {
        nextCalled = true;
    });
    assert(nextCalled, "next should be called for admin");
});

Deno.test("auth middleware blocks non-admin", async () => {
    let nextCalled = false;
    const ctx = {
        from: { id: 67890, first_name: "John", last_name: "Doe", id_string: "67890" },
        update: { message: { from_user: { id: 67890 } } },
        api: {
            sendMessage: () => Promise.resolve()
        },
        next: () => {
            nextCalled = true;
        }
    } as unknown as Context;

    await auth(ctx, async () => {
        nextCalled = true;
    });
    assert(!nextCalled, "next should NOT be called for non-admin");
});

Deno.test("auth middleware CURRENTLY allows business messages from ANYONE", async () => {
    let nextCalled = false;
    const ctx = {
        from: { id: 67890 },
        businessConnectionId: "some-id",
        next: () => {
            nextCalled = true;
        }
    } as unknown as Context;

    await auth(ctx, async () => {
        nextCalled = true;
    });
    // THIS IS THE BUG WE ARE FIXING: it currently allows it
    assert(nextCalled, "BUG: next should NOT be called for non-admin even if it's a business message (but currently it is)");
});
