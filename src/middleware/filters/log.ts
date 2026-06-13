import { Context, NextFunction } from 'grammy'

const logUpdate = (ctx: Context) => {
	console.debug(ctx.update)
}

export const log = async (ctx: Context, next: NextFunction) => {
	// take time before
	const before = Date.now() // milliseconds

	logUpdate(ctx)

	// invoke downstream middleware
	try {
		await next() // make sure to `await`!
	} catch (e) {
		console.error(`Got error: ${e}`, e)
	} finally {
		// take time after
		// log difference
		console.log(
			`Response time update[${ctx.update.update_id}]: ${
				Date.now() - before
			} ms`,
		)
	}
}
