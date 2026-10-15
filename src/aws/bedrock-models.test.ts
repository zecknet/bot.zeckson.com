import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock'
import { GetProductsCommand, PricingClient } from '@aws-sdk/client-pricing'
import { assertEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import { formatBedrockModelsList, getMergedBedrockModels } from './bedrock-models.ts'
import { initConfig } from '../config.ts'

// Mock config for testing
initConfig({
	ADMIN_USER_IDS: '12345',
	BOT_TOKEN: 'test_token',
	AWS_ACCESS_KEY_ID: 'test_key',
	AWS_SECRET_ACCESS_KEY: 'test_secret',
	AWS_REGION: 'us-west-2',
})

Deno.test('getMergedBedrockModels merges models and prices correctly', async () => {
	const bedrockStub = stub(BedrockClient.prototype, 'send', (command) => {
		if (command instanceof ListFoundationModelsCommand) {
			return Promise.resolve({
				modelSummaries: [
					{
						modelId: 'anthropic.claude-3-sonnet',
						modelName: 'Claude 3 Sonnet',
						providerName: 'Anthropic',
						outputModalities: ['TEXT'],
					},
					{
						modelId: 'amazon.titan-image-generator-v1',
						modelName: 'Titan Image Generator v1',
						providerName: 'Amazon',
						outputModalities: ['IMAGE'],
					},
				],
			})
		}
		return Promise.reject(new Error('Unknown command'))
	})

	const pricingStub = stub(PricingClient.prototype, 'send', (command) => {
		if (command instanceof GetProductsCommand) {
			return Promise.resolve({
				PriceList: [
					JSON.stringify({
						product: {
							attributes: {
								modelId: 'anthropic.claude-3-sonnet',
								usageType: 'USW2-Bedrock-OnDemand-Input-Token',
							},
						},
						terms: {
							OnDemand: {
								'some-code': {
									priceDimensions: {
										'dim-code': {
											pricePerUnit: { USD: '0.000003' },
										},
									},
								},
							},
						},
					}),
					JSON.stringify({
						product: {
							attributes: {
								modelId: 'anthropic.claude-3-sonnet',
								usageType: 'USW2-Bedrock-OnDemand-Output-Token',
							},
						},
						terms: {
							OnDemand: {
								'some-code': {
									priceDimensions: {
										'dim-code': {
											pricePerUnit: { USD: '0.000015' },
										},
									},
								},
							},
						},
					}),
				],
			})
		}
		return Promise.reject(new Error('Unknown command'))
	})

	try {
		const merged = await getMergedBedrockModels()
		assertEquals(merged.length, 2)

		const claude = merged.find((m) => m.modelId === 'anthropic.claude-3-sonnet')
		assertEquals(claude?.inputPrice, 0.000003)
		assertEquals(claude?.outputPrice, 0.000015)
		assertEquals(claude?.modalities, ['TEXT'])

		const titan = merged.find((m) => m.modelId === 'amazon.titan-image-generator-v1')
		assertEquals(titan?.inputPrice, undefined)
		assertEquals(titan?.outputPrice, undefined)
		assertEquals(titan?.modalities, ['IMAGE'])
	} finally {
		bedrockStub.restore()
		pricingStub.restore()
	}
})

Deno.test('formatBedrockModelsList formats the output correctly', () => {
	const models = [
		{
			modelId: 'anthropic.claude-3-sonnet',
			modelName: 'Claude 3 Sonnet',
			providerName: 'Anthropic',
			inputPrice: 0.000003,
			outputPrice: 0.000015,
			modalities: ['TEXT'],
		},
		{
			modelId: 'amazon.titan-image-generator-v1',
			modelName: 'Titan Image Generator v1',
			providerName: 'Amazon',
			inputPrice: 0.0001,
			outputPrice: 0.0002,
			modalities: ['IMAGE'],
		},
	]

	// @ts-ignore: Testing formatting with incomplete modality list
	const output = formatBedrockModelsList(models)
	
	// Check title
	assertEquals(output.includes('*Amazon Bedrock Models & Pricing (On-Demand)*'), true)
	// Check provider grouping
	assertEquals(output.includes('*Anthropic*'), true)
	assertEquals(output.includes('*Amazon*'), true)
	// Check model formatting
	assertEquals(output.includes('• Claude 3 Sonnet: `$3.00 (In) / $15.00 (Out)`'), true)
	// Check emoji for image generator
	assertEquals(output.includes('• Titan Image Generator v1 🖼️: `$100.00 (In) / $200.00 (Out)`'), true)
	// Check footer
	assertEquals(output.includes('_Prices are per 1,000,000 tokens._'), true)
})
