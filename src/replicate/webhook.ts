import { validateWebhook } from 'replicate';
import { config } from '../config.ts';


const secret = config.REPLICATE_WEBHOOK_SIGNING_SECRET;
export async function webhook(request: Request): Promise<Response> {

    if (request.method !== "POST") {
        return Response.json({ detail: "Method not allowed" }, { status: 405 });
    }

    const url = new URL(request.url)
    const [_, messageId, chatId] = url.pathname.split("/").map(Number)
    console.log("Message ID:", messageId)
    console.log("Chat ID:", chatId)

    if (!messageId || !chatId) {
        return Response.json({ detail: "Invalid webhook URL" }, { status: 400 });
    }

    const body = await request.json();
    if (!secret) {
        console.log("Skipping webhook validation. To validate webhooks, set REPLICATE_WEBHOOK_SIGNING_SECRET")
    } else {
        const webhookIsValid = await validateWebhook(request.clone(), secret);

        if (!webhookIsValid) {
            return Response.json({ detail: "Webhook is invalid" }, { status: 401 });
        }

        console.log("Webhook is valid!");
    }

    // process validated webhook here...
    console.log(body);

    return Response.json({ detail: "Webhook is valid" }, { status: 200 });
}

