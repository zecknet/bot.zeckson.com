import { Composer, Context } from 'grammy'
import { CommandComposer } from '../../util/commands.ts'
import { bedrockWeeklyCosts, modelUsages } from './cost-handler.ts'
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


aws.commands = [
	EC2,
	COST_BEDROCK,
	BEDROCK_USAGE,
]

aws.command(EC2.command, ec2Handler)
aws.command(COST_BEDROCK.command, bedrockWeeklyCosts)
aws.command(BEDROCK_USAGE.command, modelUsages)

aws.callbackQuery(
	/^aws:(start|stop):(.+)$/,
	callbackHandler as unknown as (ctx: Context) => Promise<void>,
)

export default aws
