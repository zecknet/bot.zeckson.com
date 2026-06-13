import {
	DescribeInstancesCommand,
	EC2Client,
	Instance,
	StartInstancesCommand,
	StopInstancesCommand,
} from '@aws-sdk/client-ec2'
import { getConfig } from './aws.config.ts'

const getEC2Client = () => {
	return new EC2Client(getConfig())
}

export const getInstances = async (): Promise<Instance[]> => {
	const client = getEC2Client()
	const command = new DescribeInstancesCommand({})
	const response = await client.send(command)

	return response.Reservations?.flatMap(
		(r) => r.Instances || [],
	) || []
}

export const startInstance = async (instanceId: string) => {
	const client = getEC2Client()
	const command = new StartInstancesCommand({ InstanceIds: [instanceId] })
	return await client.send(command)
}

export const stopInstance = async (instanceId: string) => {
	const client = getEC2Client()
	const command = new StopInstancesCommand({ InstanceIds: [instanceId] })
	return await client.send(command)
}
