import { request } from "./request.ts";

export const createPrediction = (prompt: string, callbackUrl: string) =>  {
    return request(prompt, {
        webhook: callbackUrl,
        webhook_events_filter: ["completed"]
    })
}
