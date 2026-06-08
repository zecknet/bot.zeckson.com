import { DescribeInstancesCommand, EC2Client, Instance, StartInstancesCommand, StopInstancesCommand, } from '@aws-sdk/client-ec2'
import { assertEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import { Context, InlineKeyboard } from 'grammy'
import { initConfig } from '../config.ts'
import { callbackHandler, ec2Handler, getInstances, startInstance, stopInstance, } from './aws.ts'

// Mock config for testing
initConfig({
	ADMIN_USER_IDS: '12345',
	BOT_TOKEN: 'test_token',
	AWS_ACCESS_KEY_ID: 'test_key',
	AWS_SECRET_ACCESS_KEY: 'test_secret',
	AWS_REGION: 'us-west-2',
})

Deno.test('getInstances returns instances from AWS', async () => {
	const mockInstances: Instance[] = [
		{
			InstanceId: 'i-123',
			State: { Name: 'running' },
			Tags: [{ Key: 'Name', Value: 'TestInstance' }],
		},
	]

	const sendStub = stub(EC2Client.prototype, 'send', (command) => {
		if (command instanceof DescribeInstancesCommand) {
			return Promise.resolve({
				Reservations: [{ Instances: mockInstances }],
			})
		}
		return Promise.reject(new Error('Unknown command'))
	})

	try {
		const instances = await getInstances()
		assertEquals(instances.length, 1)
		assertEquals(instances[0].InstanceId, 'i-123')
		assertEquals(instances[0].State?.Name, 'running')
	} finally {
		sendStub.restore()
	}
})

Deno.test('startInstance sends StartInstancesCommand', async () => {
	let commandSent = false
	const sendStub = stub(EC2Client.prototype, 'send', (command) => {
		if (command instanceof StartInstancesCommand) {
			commandSent = true
			assertEquals(command.input.InstanceIds, ['i-123'])
			return Promise.resolve({})
		}
		return Promise.reject(new Error('Unknown command'))
	})

	try {
		await startInstance('i-123')
		assertEquals(commandSent, true)
	} finally {
		sendStub.restore()
	}
})

Deno.test('stopInstance sends StopInstancesCommand', async () => {
	let commandSent = false
	const sendStub = stub(EC2Client.prototype, 'send', (command) => {
		if (command instanceof StopInstancesCommand) {
			commandSent = true
			assertEquals(command.input.InstanceIds, ['i-123'])
			return Promise.resolve({})
		}
		return Promise.reject(new Error('Unknown command'))
	})

	try {
		await stopInstance('i-123')
		assertEquals(commandSent, true)
	} finally {
		sendStub.restore()
	}
})

Deno.test('ec2 command sends instance info', async () => {
	const mockInstances: Instance[] = [
		{
			InstanceId: 'i-123',
			State: { Name: 'stopped' },
			InstanceType: 't2.micro',
			Tags: [{ Key: 'Name', Value: 'TestInstance' }],
		},
	]

	const sendStub = stub(EC2Client.prototype, 'send', (command) => {
		if (command instanceof DescribeInstancesCommand) {
			return Promise.resolve({
				Reservations: [{ Instances: mockInstances }],
			})
		}
		return Promise.reject(new Error('Unknown command'))
	})

	const replies: { text: string; options?: { reply_markup: InlineKeyboard } }[] = []
	const ctx = {
		reply: (text: string, options?: { reply_markup: InlineKeyboard }) => {
			replies.push({ text, options })
			return Promise.resolve()
		},
	} as unknown as Context

	try {
		await ec2Handler(ctx)
		assertEquals(replies.length, 1)
		assertEquals(replies[0].text.includes('*TestInstance*'), true)
		assertEquals(replies[0].text.includes('`i-123`'), true)
		assertEquals(
			replies[0].options?.reply_markup?.inline_keyboard?.[0][0].text,
			'▶️ Start',
		)
	} finally {
		sendStub.restore()
	}
})

Deno.test('callbackHandler processes start action', async () => {
	let commandSent = false
	const sendStub = stub(EC2Client.prototype, 'send', (command) => {
		if (command instanceof StartInstancesCommand) {
			commandSent = true
			return Promise.resolve({})
		}
		return Promise.reject(new Error('Unknown command'))
	})

	const answers: { text?: string }[] = []
	const replies: { text: string; options?: unknown }[] = []
	const ctx = {
		match: [undefined, 'start', 'i-123'],
		answerCallbackQuery: (options: { text?: string }) => {
			answers.push(options)
			return Promise.resolve()
		},
		editMessageReplyMarkup: () => Promise.resolve(),
		reply: (text: string, options?: unknown) => {
			replies.push({ text, options })
			return Promise.resolve()
		},
	} as unknown as Context & { match: RegExpExecArray }

	try {
		await callbackHandler(ctx)
		assertEquals(commandSent, true)
		assertEquals(answers[0].text, 'Starting instance...')
		assertEquals(replies[0].text.includes('i-123'), true)
		assertEquals(replies[0].text.includes('starting'), true)
	} finally {
		sendStub.restore()
	}
})

Deno.test('callbackHandler processes stop action', async () => {
	let commandSent = false
	const sendStub = stub(EC2Client.prototype, 'send', (command) => {
		if (command instanceof StopInstancesCommand) {
			commandSent = true
			return Promise.resolve({})
		}
		return Promise.reject(new Error('Unknown command'))
	})

	const answers: { text?: string }[] = []
	const replies: { text: string; options?: unknown }[] = []
	const ctx = {
		match: [undefined, 'stop', 'i-456'],
		answerCallbackQuery: (options: { text?: string }) => {
			answers.push(options)
			return Promise.resolve()
		},
		editMessageReplyMarkup: () => Promise.resolve(),
		reply: (text: string, options?: unknown) => {
			replies.push({ text, options })
			return Promise.resolve()
		},
	} as unknown as Context & { match: RegExpExecArray }

	try {
		await callbackHandler(ctx)
		assertEquals(commandSent, true)
		assertEquals(answers[0].text, 'Stopping instance...')
		assertEquals(replies[0].text.includes('i-456'), true)
		assertEquals(replies[0].text.includes('stopping'), true)
	} finally {
		sendStub.restore()
	}
})

Deno.test('ec2 command handles error when fetching instances', async () => {
	const sendStub = stub(EC2Client.prototype, 'send', () => {
		return Promise.reject(new Error('AWS Error'))
	})

	const replies: string[] = []
	const ctx = {
		reply: (text: string) => {
			replies.push(text)
			return Promise.resolve()
		},
	} as unknown as Context

	try {
		await ec2Handler(ctx)
		assertEquals(replies.length, 1)
		assertEquals(replies[0].includes('Failed to fetch EC2 instances: AWS Error'), true)
	} finally {
		sendStub.restore()
	}
})

Deno.test('callbackHandler handles error when starting instance', async () => {
	const sendStub = stub(EC2Client.prototype, 'send', () => {
		return Promise.reject(new Error('Start Error'))
	})

	const replies: string[] = []
	const ctx = {
		match: [undefined, 'start', 'i-123'],
		answerCallbackQuery: () => Promise.resolve(),
		editMessageReplyMarkup: () => Promise.resolve(),
		reply: (text: string) => {
			replies.push(text)
			return Promise.resolve()
		},
	} as unknown as Context & { match: RegExpExecArray }

	try {
		await callbackHandler(ctx)
		assertEquals(replies.length, 1)
		assertEquals(replies[0].includes('Failed to start instance: Start Error'), true)
	} finally {
		sendStub.restore()
	}
})
