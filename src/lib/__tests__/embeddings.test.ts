/**
 * @jest-environment node
 */

import { generateEmbedding, cosineSimilarity } from "../embeddings"
import { trackOpenAIUsage } from "../cost-tracker"

jest.mock("../cost-tracker", () => ({
  trackOpenAIUsage: jest.fn(),
}))

global.fetch = jest.fn()

describe("embeddings", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("generateEmbedding", () => {
    it("returns empty array when apiKey is not provided", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation()

      const result = await generateEmbedding("hello world")

      expect(result).toEqual([])
      expect(fetch).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith(
        "[embeddings] OpenAI API key not set, skipping embedding generation"
      )

      warnSpy.mockRestore()
    })

    it("calls OpenAI API and returns embedding", async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
          usage: { total_tokens: 12 },
        }),
      })

      const result = await generateEmbedding("query", {
        apiKey: "test-openai-key",
      })

      expect(result).toEqual([0.1, 0.2, 0.3])
      expect(fetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/embeddings",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-openai-key",
          }),
        })
      )
    })

    it("tracks usage when userId is provided", async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ embedding: [0.9, 0.8] }],
          usage: { total_tokens: 42 },
        }),
      })

      await generateEmbedding("track me", {
        apiKey: "test-openai-key",
        userId: "user-1",
        summaryId: "summary-1",
      })

      expect(trackOpenAIUsage).toHaveBeenCalledWith({
        userId: "user-1",
        summaryId: "summary-1",
        model: "text-embedding-3-small",
        inputTokens: 42,
      })
    })

    it("throws when OpenAI API returns non-ok", async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "unauthorized",
      })

      await expect(
        generateEmbedding("will fail", { apiKey: "invalid-key" })
      ).rejects.toThrow("OpenAI API error: 401 unauthorized")
    })
  })

  describe("cosineSimilarity", () => {
    it("returns 1 for identical vectors", () => {
      expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6)
    })

    it("returns 0 when one vector has zero norm", () => {
      expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0)
    })

    it("throws when dimensions mismatch", () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(
        "Vectors must have the same length"
      )
    })
  })
})
