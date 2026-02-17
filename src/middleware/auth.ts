import { Context, NextFunction } from "grammy";
import { config } from "../config.ts";

export const auth = async (ctx: Context, next: NextFunction) => {
    const userId = ctx.from?.id.toString();
    const approvedIds = config.ADMIN_USER_IDS;

    if (userId && approvedIds.includes(userId)) {
        return await next();
    }

    console.log(`Unauthorized access attempt by user: ${userId}`);

    if (config.ROOT_USER_ID) {
        const userInfo = ctx.from
            ? `User: ${ctx.from.first_name} ${ctx.from.last_name || ''} (@${ctx.from.username || 'no_username'}) [${ctx.from.id}]`
            : `User: unknown`;

        const messageText = ctx.message?.text || ctx.callbackQuery?.data || 'unknown interaction';

        try {
            const botInfo = await ctx.api.getMe();
            await ctx.api.sendMessage(
                config.ROOT_USER_ID,
                `🚫 *Unauthorized Request to @${botInfo.username}*\n\n${userInfo}\n*Request:* \`${messageText}\``,
                { parse_mode: "Markdown" }
            );
        } catch (error) {
            console.error(`Failed to notify ROOT_USER_ID: ${error}`);
        }
    }
};
