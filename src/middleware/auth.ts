import { Context, NextFunction } from "grammy";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import { fmt, bold, code } from "@grammyjs/parse-mode";
import { config } from "../config.ts";

export const auth = async (ctx: Context & ParseModeFlavor, next: NextFunction) => {
    const userId = ctx.from?.id.toString();
    const approvedIds = config.ADMIN_USER_IDS;

    if (userId && approvedIds.includes(userId)) {
        return await next();
    }

    console.log(`Unauthorized access attempt by user: ${userId}`);

    if (config.ROOT_USER_ID) {
        const user = ctx.from;
        const userInfo = user
            ? fmt`User: ${user.first_name} ${user.last_name || ''} (@${user.username || 'no_username'}) [${code(user.id.toString())}]`
            : `User: unknown`;

        const messageText = ctx.message?.text || ctx.callbackQuery?.data || 'unknown interaction';

        try {
            const message = fmt`🚫 ${bold('Unauthorized Request')}\n\n${userInfo}\n${bold('Request:')} ${code(messageText)}`
            await ctx.api.sendMessage(
                config.ROOT_USER_ID,
                message.text,
                { entities: message.entities }
            );
        } catch (error) {
            console.error(`Failed to notify ROOT_USER_ID: ${error}`);
        }
    }
};
