import { GetProductsCommand, PricingClient } from '@aws-sdk/client-pricing'
import { assertEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import { BedrockModel, formatBedrockModelsList, getMergedBedrockModels } from './bedrock-models.ts'
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
	const pricingStub = stub(PricingClient.prototype, 'send', (command) => {
		if (command instanceof GetProductsCommand) {
			return Promise.resolve({
				PriceList: [
					JSON.stringify({
						product: {
							attributes: {
								provider: 'Anthropic',
								model: 'Claude 3 Sonnet',
								usagetype: 'USW2-Bedrock-OnDemand-Input-Token',
							},
						},
						terms: {
							OnDemand: {
								'some-code': {
									priceDimensions: {
										'dim-code': {
											pricePerUnit: { USD: '0.003' },
										},
									},
								},
							},
						},
					}),
					JSON.stringify({
						product: {
							attributes: {
								provider: 'Anthropic',
								model: 'Claude 3 Sonnet',
								usagetype: 'USW2-Bedrock-OnDemand-Output-Token',
							},
						},
						terms: {
							OnDemand: {
								'some-code': {
									priceDimensions: {
										'dim-code': {
											pricePerUnit: { USD: '0.015' },
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
		assertEquals(merged.length, 1)

		const claude = merged.find((m) => m.modelName === 'Claude 3 Sonnet')
		assertEquals(claude?.inputPrice, 0.003)
		assertEquals(claude?.outputPrice, 0.015)
		assertEquals(claude?.providerName, 'Anthropic')

		const titan = merged.find((m) => m.modelName === 'Titan Image Generator v1')
		assertEquals(titan, undefined)
	} finally {
		pricingStub.restore()
	}
})

Deno.test('formatBedrockModelsList formats the output correctly', () => {
	const models: BedrockModel[] = [
		{
			modelId: 'anthropic.claude-3-sonnet',
			modelName: 'Claude 3 Sonnet',
			providerName: 'Anthropic',
			inputPrice: 0.003,
			outputPrice: 0.015,
			modalities: ['TEXT'],
		},
		{
			modelId: 'amazon.titan-image-generator-v1',
			modelName: 'Titan Image Generator v1',
			providerName: 'Amazon',
			inputPrice: 0.1,
			outputPrice: 0.2,
			modalities: ['IMAGE'],
		},
	]

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
