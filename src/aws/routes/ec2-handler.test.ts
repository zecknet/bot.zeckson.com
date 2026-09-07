import { assertEquals } from '@std/assert'
import { format } from './ec2-handler.ts'
import { Instance } from '@aws-sdk/client-ec2'

Deno.test('ec2-handler format: running instance', () => {
	const mockInstance: Instance = {
		InstanceId: 'i-1234567890abcdef0',
		InstanceType: 't2.micro',
		State: { Name: 'running' },
		PublicIpAddress: '1.2.3.4',
		Tags: [{ Key: 'Name', Value: 'test-instance' }],
	}

	const result = format(mockInstance)
	assertEquals(result.text, 'test-instance (i-1234567890abcdef0)\nType: t2.micro\nState: 🟢 running\nPublic IP: 1.2.3.4')
	// Bold name, code ID, code IP
	assertEquals(result.entities.length, 3)
	assertEquals(result.entities[0].type, 'bold')
	assertEquals(result.entities[1].type, 'code')
	assertEquals(result.entities[2].type, 'code')
})

Deno.test('ec2-handler format: stopped instance without name', () => {
	const mockInstance: Instance = {
		InstanceId: 'i-0987654321fedcba0',
		InstanceType: 't3.medium',
		State: { Name: 'stopped' },
		PublicIpAddress: undefined,
		Tags: [],
	}

	const result = format(mockInstance)
	assertEquals(result.text, 'unnamed (i-0987654321fedcba0)\nType: t3.medium\nState: 🔴 stopped\nPublic IP: none')
	// Italic "unnamed", code ID, code "none"
	assertEquals(result.entities.length, 3)
	assertEquals(result.entities[0].type, 'italic')
	assertEquals(result.entities[1].type, 'code')
	assertEquals(result.entities[2].type, 'code')
})

Deno.test('ec2-handler format: pending instance', () => {
	const mockInstance: Instance = {
		InstanceId: 'i-pending',
		InstanceType: 't2.small',
		State: { Name: 'pending' },
		PublicIpAddress: undefined,
	}

	const result = format(mockInstance)
	assertEquals(result.text, 'unnamed (i-pending)\nType: t2.small\nState: 🟡 pending\nPublic IP: none')
})
