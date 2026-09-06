import { Composer, Context } from 'grammy'
import { CommandComposer } from '../../util/commands.ts'
import { bedrockWeeklyCosts, ec2WeeklyCosts, modelUsages } from './cost-handler.ts'
import { callbackHandler, ec2Handler } from './ec2-handler.ts'

const aws = new Composer<Context>() as CommandComposer<Context>

const EC2 = { command: 'ec2', description: 'Manage AWS EC2 instances' }
const COST_BEDROCK = {
	command: 'cost_bedrock',
	description: 'Get Amazon Bedrock cost for last 7 days',
}
const BEDROCK_USAGE = {
	command: 'usage_bedrock',
	description: 'Get Bedrock Models usage',
}

const EC2_COST = {
	command: 'ec2_cost',
	description: 'Get Amazon EC2 Cost (instance + others) for last 7 days',
}
aws.commands = [
	EC2,
	COST_BEDROCK,
	BEDROCK_USAGE,
	EC2_COST
]

aws.command(EC2.command, ec2Handler)
aws.command(COST_BEDROCK.command, bedrockWeeklyCosts)
aws.command(BEDROCK_USAGE.command, modelUsages)
aws.command(EC2_COST.command, ec2WeeklyCosts)

aws.callbackQuery(
	/^aws:(start|stop):(.+)$/,
	callbackHandler as unknown as (ctx: Context) => Promise<void>,
)

export default aws
