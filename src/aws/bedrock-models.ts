import { GetProductsCommand, PricingClient } from '@aws-sdk/client-pricing'
import { config } from "../config.ts"
import { getConfig } from './aws.config.ts'

export interface BedrockModel {
    modelId: string
    modelName: string
    providerName: string
    inputPrice?: number
    outputPrice?: number
    modalities?: string[]
}

export async function fetchOnDemandPrices(): Promise<Map<string, BedrockModel>> {
    // Pricing API is only available in us-east-1
    const client = new PricingClient(getConfig({ region: 'us-east-1' }))
    const prices = new Map<string, BedrockModel>()

    let nextToken: string | undefined
    do {
        const response = await client.send(
            new GetProductsCommand({
                ServiceCode: 'AmazonBedrock',
                Filters: [
                    { Type: 'TERM_MATCH', Field: 'termType', Value: 'OnDemand' },
                    { Type: 'TERM_MATCH', Field: 'regionCode', Value: config.AWS_REGION }
                ],
                NextToken: nextToken,
            }),
        )

        for (const priceListString of response.PriceList || []) {
            const priceList = JSON.parse(priceListString as string)
            const attributes = priceList.product.attributes
            const providerName = attributes.provider
            const modelName = attributes.model

            if (!providerName || !modelName) continue

            const modelId = `${providerName}-${modelName}`.toLowerCase()

            const terms = priceList.terms.OnDemand
            const term = Object.values(terms)[0] as Record<string, unknown>
            const priceDimensions = term['priceDimensions'] as object
            const dimension = Object.values(priceDimensions)[0] as Record<string, Record<string, string>>
            const pricePerUnit = parseFloat(dimension['pricePerUnit']['USD'])

            const current = prices.get(modelId) || {
                modelName,
                providerName,
            } as BedrockModel
            const type = attributes.usagetype.toLowerCase()
            if (type.includes('input')) {
                current.inputPrice = pricePerUnit
            } else if (type.includes('output')) {
                current.outputPrice = pricePerUnit
            }
            prices.set(modelId, current)
        }

        nextToken = response.NextToken
    } while (nextToken)

    return prices
}

export function formatBedrockModelsList(models: BedrockModel[]): string {
    const grouped = models.reduce((acc, m) => {
        if (!acc[m.providerName]) acc[m.providerName] = []
        acc[m.providerName].push(m)
        return acc
    }, {} as Record<string, BedrockModel[]>)

    let output = '*Amazon Bedrock Models & Pricing (On-Demand)*\n\n'

    const providers = Object.keys(grouped).sort()
    for (const provider of providers) {
        output += `*${provider}*\n\n`
        const providerModels = grouped[provider].sort((a, b) => a.modelName.localeCompare(b.modelName))
        for (const m of providerModels) {
            const input = m.inputPrice !== undefined ? `$${(m.inputPrice * 1_000).toFixed(2)}` : 'N/A'
            const outputPrice = m.outputPrice !== undefined ? `$${(m.outputPrice * 1_000).toFixed(2)}` : 'N/A'

            let abilities = ''
            const modalities = m.modalities as string[] || []
            if (modalities.includes('IMAGE')) abilities += ' 🖼️'
            if (modalities.includes('VIDEO')) abilities += ' 🎥'

            output += `• ${m.modelName}${abilities}: \`${input} (In) / ${outputPrice} (Out)\`\n\n`
        }
        output += '\n\n'
    }

    output += '_Prices are per 1,000,000 tokens._'
    return output
}

export async function getMergedBedrockModels(): Promise<BedrockModel[]> {
    const prices = await fetchOnDemandPrices()

    return prices.values().toArray()
}
