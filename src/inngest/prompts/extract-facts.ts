/**
 * Step1: 事実抽出プロンプト
 * モデル: claude-3-5-haiku-20241022（高速・低コスト）
 */

export interface ExtractedFacts {
  keyPoints: string[]
  mainClaim: string
  caveats: string[]
  techKeywords: string[]
}

export function buildExtractFactsPrompt(articleText: string): {
  system: string
  userMessage: string
} {
  const system = `あなたは技術記事の要点を構造的に抽出するアシスタントです。
記事を読み、以下のJSON形式で出力してください。

**出力形式:**
\`\`\`json
{
  "keyPoints": ["要点1", "要点2", "要点3"],
  "mainClaim": "この記事の主張",
  "caveats": ["注意点1", "注意点2"],
  "techKeywords": ["キーワード1", "キーワード2"]
}
\`\`\`

**抽出ルール:**
- keyPoints: 記事の重要なポイントを3〜5個（各50文字以内）
- mainClaim: 記事の核心的な主張を1文で（100文字以内）
- caveats: 注意点や制約があれば記載（なければ空配列）
- techKeywords: 技術キーワードを5〜10個（固有名詞、技術用語）

**重要:** 必ずJSON形式のみを返してください。説明文は不要です。`

  // 記事本文を最大30,000トークン（約12万文字）に制限
  const maxLength = 120000
  const truncatedText =
    articleText.length > maxLength
      ? articleText.substring(0, maxLength) + "\n\n[以降省略...]"
      : articleText

  const userMessage = `以下の記事から事実を抽出してください。

【記事本文】
${truncatedText}

JSON形式で出力してください。`

  return { system, userMessage }
}
