/**
 * @jest-environment node
 */

import { kmeans, assignThemeLabels } from "../clustering"

global.fetch = jest.fn()

describe("clustering", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("kmeans", () => {
    it("returns empty array for empty input", () => {
      expect(kmeans([], 3)).toEqual([])
    })

    it("returns one-cluster-per-item when vectors.length <= k", () => {
      const vectors = [
        [0, 0],
        [1, 1],
      ]
      expect(kmeans(vectors, 5)).toEqual([0, 1])
    })
  })

  describe("assignThemeLabels", () => {
    const summaries = [
      { id: "s1", summary: "TypeScript tips" },
      { id: "s2", summary: "React hooks memo" },
      { id: "s3", summary: "PostgreSQL tuning" },
    ]
    const clusters = [0, 0, 1]

    it("falls back to その他 when apiKey is missing", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation()

      const result = await assignThemeLabels(clusters, summaries)

      expect(Array.from(result.values())).toEqual(["その他", "その他", "その他"])
      expect(fetch).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it("uses OpenAI response as theme when apiKey is provided", async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "フロントエンド" } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "データベース" } }],
          }),
        })

      const result = await assignThemeLabels(clusters, summaries, "test-openai-key")

      expect(result.get("s1")).toBe("フロントエンド")
      expect(result.get("s2")).toBe("フロントエンド")
      expect(result.get("s3")).toBe("データベース")
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it("falls back to その他 when OpenAI call fails", async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "rate_limited",
      })

      const errorSpy = jest.spyOn(console, "error").mockImplementation()

      const result = await assignThemeLabels(clusters, summaries, "test-openai-key")

      expect(result.get("s1")).toBe("その他")
      expect(result.get("s2")).toBe("その他")
      expect(result.get("s3")).toBe("その他")
      expect(errorSpy).toHaveBeenCalled()

      errorSpy.mockRestore()
    })
  })
})
