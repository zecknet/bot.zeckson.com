export default class ServerResponse {
	static DEFAULT_HEADERS = {
		'Content-Type': 'application/json',
	}

	public static text(text: string): Response {
		return ServerResponse.ok(text, { 'Content-Type': 'text/plain' })
	}

	static json(json: object): Response {
		return ServerResponse.ok(JSON.stringify(json, null, 2))
	}

	static ok(
		body?: BodyInit,
		headers: HeadersInit = ServerResponse.DEFAULT_HEADERS,
	) {
		return new Response(
			body,
			{
				headers,
				status: 200,
				statusText: 'OK',
			},
		)
	}
}
