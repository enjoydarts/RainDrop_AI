import { ExtractedFacts } from "./extract-facts"

/**
 * Step2: 自分語り要約生成プロンプト
 * モデル: claude-3-5-sonnet-20241022（品質重視）
 */

export type Tone = "snarky" | "neutral" | "enthusiastic" | "casual"

export interface GeneratedSummary {
  summary: string
  rating: number // 1-5
  reason: string
}

/**
 * トーン別の口調定義
 */
const TONE_DESCRIPTIONS: Record<Tone, string> = {
  snarky: `毒舌風。皮肉やツッコミを交えながら本質を突く。
例: 「まぁ要するに〇〇ってことなんだけど、△△みたいな甘い話じゃないんだよね。」`,

  neutral: `客観的・事務的。感情を排除し、事実ベースで淡々と説明する。
例: 「本記事では〇〇について論じている。主な主張は△△である。」`,

  enthusiastic: `熱量高め。ポジティブでやる気が伝わる前向きな表現。
例: 「これめっちゃ良い！〇〇が△△で、すごく参考になるわ！」`,

  casual: `カジュアル・親しみやすい。会話調でリラックスした雰囲気。
例: 「この記事、〇〇について書いてるんだけど、△△らしいよ。なるほどねー。」`,
}

export function buildGenerateSummaryPrompt(
  facts: ExtractedFacts,
  tone: Tone
): {
  system: string
  userMessage: string
} {
  const toneDescription = TONE_DESCRIPTIONS[tone]

  const system = `あなたは${tone}な口調で記事の要約を書くアシスタントです。
以下の事実を基に、「自分が読んだフリができる」要約を生成してください。

**要件:**
- 口調: ${toneDescription}
- 文字数: 400〜700文字
- 含めるべき内容:
  - 記事の概要（何について書かれているか）
  - 注目ポイント（興味深い点、新規性、独自性）
  - 有用性の評価（参考になりそうか、実用的か）
  - 5段階評価（1〜5）と一言理由

**出力形式:**
\`\`\`json
{
  "summary": "要約本文（400〜700文字）",
  "rating": 4,
  "reason": "実装例が豊富で実践的"
}
\`\`\`

**重要:** 必ずJSON形式のみを返してください。`

  const userMessage = `以下の事実から要約を生成してください。

【抽出された事実】
${JSON.stringify(facts, null, 2)}

【口調】
${tone}

JSON形式で出力してください。`

  return { system, userMessage }
}
