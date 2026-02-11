import Anthropic from "@anthropic-ai/sdk"

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable is not set")
}

/**
 * Anthropic Claude クライアント
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * モデル定義
 */
export const MODELS = {
  HAIKU: "claude-3-5-haiku-20241022",
  SONNET: "claude-3-5-sonnet-20241022",
} as const

export type ModelType = (typeof MODELS)[keyof typeof MODELS]

/**
 * JSON形式でメッセージを送信
 */
export async function sendJsonMessage<T = any>(params: {
  model: ModelType
  system?: string
  messages: Anthropic.MessageParam[]
  maxTokens?: number
}): Promise<{
  content: T
  usage: {
    input_tokens: number
    output_tokens: number
  }
}> {
  const { model, system, messages, maxTokens = 2048 } = params

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages,
  })

  // JSON形式のレスポンスをパース
  const textContent = response.content.find((c) => c.type === "text")
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in response")
  }

  // JSONブロックを抽出（```json ... ``` 形式も対応）
  let jsonText = textContent.text.trim()
  const jsonBlockMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonBlockMatch) {
    jsonText = jsonBlockMatch[1].trim()
  }

  try {
    const content = JSON.parse(jsonText)
    return {
      content,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    }
  } catch (error) {
    console.error("Failed to parse JSON response:", jsonText)
    throw new Error(`Invalid JSON response: ${error}`)
  }
}

/**
 * トークン数を推定（簡易版）
 * 実際のトークン数は使用後にusageから取得
 */
export function estimateTokens(text: string): number {
  // 英語: 約4文字/トークン、日本語: 約2文字/トークン
  // 簡易的に平均3文字/トークンと仮定
  return Math.ceil(text.length / 3)
}
