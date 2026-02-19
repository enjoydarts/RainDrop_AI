/**
 * @jest-environment node
 */

import { MODELS, estimateTokens } from "../anthropic"

// Note: sendJsonMessage のテストはInngest関数の統合テストでカバー
// anthropicクライアントの初期化がモジュールレベルで行われるため、
// ユニットテストでのモックが困難なため

describe("anthropic", () => {
  describe("MODELS", () => {
    it("should have HAIKU model", () => {
      expect(MODELS.HAIKU).toBe("claude-haiku-4-5")
    })

    it("should have SONNET model", () => {
      expect(MODELS.SONNET).toBe("claude-sonnet-4-5")
    })

    it("should have correct model names", () => {
      // MODELSは`as const`で型レベルreadonly
      expect(MODELS).toHaveProperty("HAIKU")
      expect(MODELS).toHaveProperty("SONNET")
    })
  })

  describe("estimateTokens", () => {
    it("should estimate tokens for English text", () => {
      const text = "Hello world"
      const tokens = estimateTokens(text)
      expect(tokens).toBe(Math.ceil(text.length / 3))
      expect(tokens).toBe(4)
    })

    it("should estimate tokens for Japanese text", () => {
      const text = "こんにちは世界"
      const tokens = estimateTokens(text)
      expect(tokens).toBe(Math.ceil(text.length / 3))
      expect(tokens).toBe(3)
    })

    it("should estimate tokens for mixed text", () => {
      const text = "Hello こんにちは" // "Hello " = 6文字, "こんにちは" = 5文字 = 11文字
      const tokens = estimateTokens(text)
      expect(tokens).toBe(Math.ceil(text.length / 3))
      // 11文字 / 3 = 3.66... -> 4トークン
      expect(tokens).toBe(4)
    })

    it("should handle empty string", () => {
      const tokens = estimateTokens("")
      expect(tokens).toBe(0)
    })

    it("should handle long text", () => {
      const text = "a".repeat(1000)
      const tokens = estimateTokens(text)
      expect(tokens).toBe(Math.ceil(1000 / 3))
      expect(tokens).toBe(334)
    })

    it("should round up fractional tokens", () => {
      // 10文字 / 3 = 3.33... -> 4トークン
      const text = "1234567890"
      const tokens = estimateTokens(text)
      expect(tokens).toBe(4)
    })

    it("should estimate correctly for various lengths", () => {
      expect(estimateTokens("a")).toBe(1) // 1/3 = 0.33 -> 1
      expect(estimateTokens("ab")).toBe(1) // 2/3 = 0.66 -> 1
      expect(estimateTokens("abc")).toBe(1) // 3/3 = 1
      expect(estimateTokens("abcd")).toBe(2) // 4/3 = 1.33 -> 2
      expect(estimateTokens("abcde")).toBe(2) // 5/3 = 1.66 -> 2
      expect(estimateTokens("abcdef")).toBe(2) // 6/3 = 2
    })

    it("should handle special characters", () => {
      const text = "!@#$%^&*()"
      const tokens = estimateTokens(text)
      expect(tokens).toBe(Math.ceil(text.length / 3))
    })

    it("should handle unicode emoji", () => {
      const text = "🎉🎊🎈"
      const tokens = estimateTokens(text)
      // emojiは2文字とカウントされるので、6文字 / 3 = 2トークン
      expect(tokens).toBeGreaterThan(0)
    })

    it("should handle newlines and whitespace", () => {
      const text = "Hello\n\nWorld\t!"
      const tokens = estimateTokens(text)
      expect(tokens).toBe(Math.ceil(text.length / 3))
    })
  })
})
