import { Composer, Context } from 'grammy'
import { CommandComposer } from '../../util/commands.ts'
import { costHandler } from "./cost-handler.ts"
import { callbackHandler, ec2Handler } from "./ec2-handler.ts"

const aws = new Composer<Context>() as CommandComposer<Context>

const EC2 = { command: 'ec2', description: 'Manage AWS EC2 instances' }
const COST = {
	command: 'ec2_cost',
	description: 'Get Current cost of AWS EC2 instances',
}

aws.commands = [
	EC2,
	COST,
]

aws.command(EC2.command, ec2Handler)
aws.command(COST.command, costHandler)

aws.callbackQuery(
	/^aws:(start|stop):(.+)$/,
	callbackHandler as unknown as (ctx: Context) => Promise<void>,
)

export default aws
