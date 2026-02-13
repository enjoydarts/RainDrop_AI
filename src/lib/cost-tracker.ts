import { db } from "@/db"
import { apiUsage } from "@/db/schema"

/**
 * Anthropic API価格表（2026年2月時点）
 * https://platform.claude.com/docs/en/about-claude/models/overview
 */
const ANTHROPIC_PRICING = {
  "claude-sonnet-4-5": {
    input: 3.0 / 1_000_000, // $3.00 per 1M tokens
    output: 15.0 / 1_000_000, // $15.00 per 1M tokens
  },
  "claude-haiku-4-5": {
    input: 1.0 / 1_000_000, // $1.00 per 1M tokens
    output: 5.0 / 1_000_000, // $5.00 per 1M tokens
  },
  // 旧モデル名との互換性（存在する場合）
  "claude-3-5-sonnet-20241022": {
    input: 3.0 / 1_000_000,
    output: 15.0 / 1_000_000,
  },
  "claude-3-5-haiku-20241022": {
    input: 1.0 / 1_000_000,
    output: 5.0 / 1_000_000,
  },
} as const

/**
 * コストを計算
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = ANTHROPIC_PRICING[model as keyof typeof ANTHROPIC_PRICING]

  if (!pricing) {
    console.warn(`Unknown model for pricing: ${model}`)
    return 0
  }

  return inputTokens * pricing.input + outputTokens * pricing.output
}

/**
 * Anthropic API使用状況を記録
 */
export async function trackAnthropicUsage(params: {
  userId: string
  summaryId?: string
  model: string
  inputTokens: number
  outputTokens: number
}): Promise<void> {
  const { userId, summaryId, model, inputTokens, outputTokens } = params

  const cost = calculateCost(model, inputTokens, outputTokens)

  await db.insert(apiUsage).values({
    userId,
    summaryId: summaryId || null,
    apiProvider: "anthropic",
    model,
    inputTokens,
    outputTokens,
    costUsd: cost.toFixed(6),
  })
}

/**
 * Raindrop API使用状況を記録
 */
export async function trackRaindropUsage(params: { userId: string }): Promise<void> {
  const { userId } = params

  await db.insert(apiUsage).values({
    userId,
    apiProvider: "raindrop",
    costUsd: "0", // 無料
  })
}

/**
 * Extract API使用状況を記録
 */
export async function trackExtractUsage(params: { userId: string }): Promise<void> {
  const { userId } = params

  await db.insert(apiUsage).values({
    userId,
    apiProvider: "extract",
    costUsd: "0", // 自前サービスなので無料
  })
}
