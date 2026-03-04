import { fmt, FormattedString } from '@grammyjs/parse-mode'
import { Context, NextFunction } from 'grammy'
import { config } from '../config.ts'

export const auth = async (
	ctx: Context,
	next: NextFunction,
) => {
	const userId = ctx.from?.id.toString()
	const approvedIds = config.ADMIN_USER_IDS

	if (userId && approvedIds.includes(userId)) {
		return await next()
	}

	if (ctx.businessConnectionId) return await next()

	const updateType =
		Object.keys(ctx.update).find((key) => key !== 'update_id') ??
			'unknown'
	console.log(
		`Unauthorized access attempt by user: ${userId} (Update type: ${updateType})`,
	)

	if (config.ROOT_USER_ID) {
		const user = ctx.from
		const userInfo = user
			? fmt`User: ${
				FormattedString.mentionUser(
					`${user.first_name} ${user.last_name || ''}`,
					user.id,
				)
			} ${user.username ? `(@${user.username})` : ``} [${
				FormattedString.code(user.id.toString())
			}]`
			: fmt`User: unknown`

		const update = ctx.update as unknown
		const content = ctx.msg
			? FormattedString.blockquote(ctx.msg)
			: FormattedString.pre(
				JSON.stringify(update, undefined, 2),
				`json`,
			)

		const message = fmt`🚫 ${FormattedString.bold('Unauthorized Request')}

${userInfo}
${FormattedString.bold('Update Type:')} ${FormattedString.code(updateType)}
${FormattedString.bold('Content:')}
${content}`

		try {
			await ctx.api.sendMessage(
				config.ROOT_USER_ID,
				message.text,
				{ entities: message.entities },
			)
		} catch (error) {
			console.error(`Failed to notify ROOT_USER_ID: ${error}`)
		}
	}
}
