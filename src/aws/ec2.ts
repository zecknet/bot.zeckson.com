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

export const startInstance = async (
	instanceId: string,
): Promise<Instance | undefined> => {
	const client = getEC2Client()
	const command = new StartInstancesCommand({ InstanceIds: [instanceId] })
	const response = await client.send(command)
	return response.StartingInstances?.[0]
}

export const stopInstance = async (
	instanceId: string,
): Promise<Instance | undefined> => {
	const client = getEC2Client()
	const command = new StopInstancesCommand({ InstanceIds: [instanceId] })
	const req = await client.send(command)
	return req.StoppingInstances?.[0]
}
