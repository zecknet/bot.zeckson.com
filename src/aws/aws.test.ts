import {
	DescribeInstancesCommand,
	EC2Client,
	Instance,
	StartInstancesCommand,
	StopInstancesCommand,
} from '@aws-sdk/client-ec2'
import { assertEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import { initConfig } from '../config.ts'
import { getInstances, startInstance, stopInstance } from './ec2.ts'

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
