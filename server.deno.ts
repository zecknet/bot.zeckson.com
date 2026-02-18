import { bot } from "./src/bot.ts";
import { webhookCallback } from "grammy";

const handleUpdate = webhookCallback(bot, "std/http", {
  timeoutMilliseconds: 30000,
});

export const handleWebhook = async (req: Request) => {
  if (req.method == "POST") {
    const url = new URL(req.url);
    if (url.pathname.slice(1) == bot.token) {
      try {
        return await handleUpdate(req);
      } catch (err) {
        console.error(err);
        return Response.error()
      }
    }
  }
  return undefined;
}

export const setWebhook = async (path: string) => {
  // Set webhook only for production
  await bot.api.setWebhook(path)

  console.log(
      `Webhook is set to: ${path}`,
  )
}
