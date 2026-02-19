/**
 * @jest-environment node
 */

import { calculateCost } from "../cost-tracker"

// Note: trackAnthropicUsage, trackRaindropUsage, trackExtractUsage は
// DBに依存するため、Inngest関数の統合テストでカバー

describe("cost-tracker", () => {
  describe("calculateCost", () => {
    describe("Claude 3.5 Sonnet", () => {
      const model = "claude-3-5-sonnet-20241022"

      it("should calculate cost for input tokens only", () => {
        const cost = calculateCost(model, 1_000_000, 0)
        // $3.00 per 1M input tokens
        expect(cost).toBeCloseTo(3.0, 6)
      })

      it("should calculate cost for output tokens only", () => {
        const cost = calculateCost(model, 0, 1_000_000)
        // $15.00 per 1M output tokens
        expect(cost).toBeCloseTo(15.0, 6)
      })

      it("should calculate cost for mixed tokens", () => {
        const cost = calculateCost(model, 1_000_000, 1_000_000)
        // $3.00 + $15.00 = $18.00
        expect(cost).toBeCloseTo(18.0, 6)
      })

      it("should calculate cost for small numbers", () => {
        const cost = calculateCost(model, 1000, 500)
        // (1000 * 3.0/1M) + (500 * 15.0/1M) = 0.003 + 0.0075 = 0.0105
        expect(cost).toBeCloseTo(0.0105, 6)
      })

      it("should handle zero tokens", () => {
        const cost = calculateCost(model, 0, 0)
        expect(cost).toBe(0)
      })
    })

    describe("Claude 3.5 Haiku", () => {
      const model = "claude-3-5-haiku-20241022"

      it("should calculate cost for input tokens only", () => {
        const cost = calculateCost(model, 1_000_000, 0)
        // $1.00 per 1M input tokens
        expect(cost).toBeCloseTo(1.0, 6)
      })

      it("should calculate cost for output tokens only", () => {
        const cost = calculateCost(model, 0, 1_000_000)
        // $5.00 per 1M output tokens
        expect(cost).toBeCloseTo(5.0, 6)
      })

      it("should calculate cost for mixed tokens", () => {
        const cost = calculateCost(model, 1_000_000, 1_000_000)
        // $1.00 + $5.00 = $6.00
        expect(cost).toBeCloseTo(6.0, 6)
      })

      it("should calculate cost for typical request", () => {
        // 例: 5000 input tokens, 1000 output tokens
        const cost = calculateCost(model, 5000, 1000)
        // (5000 * 1.0/1M) + (1000 * 5.0/1M) = 0.005 + 0.005 = 0.01
        expect(cost).toBeCloseTo(0.01, 6)
      })
    })

    describe("unknown model", () => {
      it("should return 0 for unknown model", () => {
        const cost = calculateCost("unknown-model", 1000, 1000)
        expect(cost).toBe(0)
      })

      it("should warn for unknown model", () => {
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation()

        calculateCost("unknown-model", 1000, 1000)

        expect(consoleSpy).toHaveBeenCalledWith(
          "Unknown Anthropic model for pricing: unknown-model"
        )

        consoleSpy.mockRestore()
      })

      it("should handle empty model name", () => {
        const cost = calculateCost("", 1000, 1000)
        expect(cost).toBe(0)
      })
    })

    describe("edge cases", () => {
      const model = "claude-3-5-sonnet-20241022"

      it("should handle very large token counts", () => {
        const cost = calculateCost(model, 10_000_000, 5_000_000)
        // (10M * 3.0/1M) + (5M * 15.0/1M) = 30 + 75 = 105
        expect(cost).toBeCloseTo(105.0, 6)
      })

      it("should handle fractional calculations correctly", () => {
        const cost = calculateCost(model, 123, 456)
        // (123 * 3.0/1M) + (456 * 15.0/1M)
        const expected = (123 * 3.0) / 1_000_000 + (456 * 15.0) / 1_000_000
        expect(cost).toBeCloseTo(expected, 8)
      })

      it("should return exact zero for zero tokens", () => {
        const cost = calculateCost(model, 0, 0)
        expect(cost).toBe(0)
        expect(cost).not.toBeCloseTo(0.0000001, 10) // exactly zero
      })
    })

    describe("cost comparison between models", () => {
      const inputTokens = 10_000
      const outputTokens = 2_000

      it("should show Haiku is cheaper than Sonnet", () => {
        const haikuCost = calculateCost(
          "claude-3-5-haiku-20241022",
          inputTokens,
          outputTokens
        )
        const sonnetCost = calculateCost(
          "claude-3-5-sonnet-20241022",
          inputTokens,
          outputTokens
        )

        expect(haikuCost).toBeLessThan(sonnetCost)
      })

      it("should calculate correct ratio between models", () => {
        const haikuCost = calculateCost("claude-3-5-haiku-20241022", 1_000_000, 0)
        const sonnetCost = calculateCost("claude-3-5-sonnet-20241022", 1_000_000, 0)

        // Sonnet input is 3x more expensive than Haiku (3.0 / 1.0 = 3)
        expect(sonnetCost / haikuCost).toBeCloseTo(3.0, 2)
      })
    })
  })
})
