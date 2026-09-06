import { Composer, Context } from 'grammy'
import { CommandComposer } from '../../util/commands.ts'
import { bedrockWeeklyCosts } from "./cost-handler.ts"
import { callbackHandler, ec2Handler } from "./ec2-handler.ts"

const aws = new Composer<Context>() as CommandComposer<Context>

const EC2 = { command: 'ec2', description: 'Manage AWS EC2 instances' }
const BEDROCK = {
	command: 'cost_bedrock',
	description: 'Get Current cost of AWS EC2 instances',
}

aws.commands = [
	EC2,
	BEDROCK,
]

aws.command(EC2.command, ec2Handler)
aws.command(BEDROCK.command, bedrockWeeklyCosts)

aws.callbackQuery(
	/^aws:(start|stop):(.+)$/,
	callbackHandler as unknown as (ctx: Context) => Promise<void>,
)

export default aws
