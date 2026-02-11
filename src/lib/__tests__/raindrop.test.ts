/**
 * @jest-environment node
 */

import { RaindropClient, RaindropItem, RaindropResponse } from "../raindrop"

// fetchをモック
global.fetch = jest.fn()

describe("RaindropClient", () => {
  let client: RaindropClient
  const mockToken = "test-access-token"

  beforeEach(() => {
    client = new RaindropClient(mockToken)
    jest.clearAllMocks()
  })

  describe("constructor", () => {
    it("should create client with access token", () => {
      const client = new RaindropClient("my-token")
      expect(client).toBeInstanceOf(RaindropClient)
    })
  })

  describe("getAllRaindrops", () => {
    const mockResponse: RaindropResponse = {
      result: true,
      items: [
        {
          _id: 1,
          title: "Test Article",
          link: "https://example.com",
          excerpt: "Test excerpt",
          cover: "https://example.com/cover.jpg",
          collection: { $id: 123 },
          tags: ["test", "article"],
          created: "2026-02-11T10:00:00Z",
        },
      ],
      count: 1,
    }

    it("should fetch raindrops with default options", async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.getAllRaindrops()

      expect(fetch).toHaveBeenCalledWith(
        "https://api.raindrop.io/rest/v1/raindrops/0?page=0&perpage=50",
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it("should fetch raindrops with custom collection ID", async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      await client.getAllRaindrops({ collectionId: 456 })

      expect(fetch).toHaveBeenCalledWith(
        "https://api.raindrop.io/rest/v1/raindrops/456?page=0&perpage=50",
        expect.any(Object)
      )
    })

    it("should fetch raindrops with pagination params", async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      await client.getAllRaindrops({ page: 2, perPage: 25 })

      expect(fetch).toHaveBeenCalledWith(
        "https://api.raindrop.io/rest/v1/raindrops/0?page=2&perpage=25",
        expect.any(Object)
      )
    })

    it("should throw error on API failure", async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      })

      await expect(client.getAllRaindrops()).rejects.toThrow(
        "Raindrop API error: 401 Unauthorized"
      )
    })

    it("should include authorization header", async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      await client.getAllRaindrops()

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        })
      )
    })
  })

  describe("getRaindrop", () => {
    const mockItem: RaindropItem = {
      _id: 123,
      title: "Single Article",
      link: "https://example.com/article",
      excerpt: "Article excerpt",
      cover: "",
      collection: { $id: 1 },
      tags: [],
      created: "2026-02-11T10:00:00Z",
    }

    it("should fetch single raindrop", async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ item: mockItem }),
      })

      const result = await client.getRaindrop(123)

      expect(fetch).toHaveBeenCalledWith(
        "https://api.raindrop.io/rest/v1/raindrop/123",
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      )
      expect(result).toEqual(mockItem)
    })

    it("should throw error on API failure", async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })

      await expect(client.getRaindrop(999)).rejects.toThrow(
        "Raindrop API error: 404 Not Found"
      )
    })
  })

  describe("fetchAllRaindrops", () => {
    it("should fetch all pages", async () => {
      const page1: RaindropResponse = {
        result: true,
        items: Array(50).fill({ _id: 1, title: "Page 1" } as RaindropItem),
        count: 100,
      }
      const page2: RaindropResponse = {
        result: true,
        items: Array(50).fill({ _id: 2, title: "Page 2" } as RaindropItem),
        count: 100,
      }
      const page3: RaindropResponse = {
        result: true,
        items: [],
        count: 100,
      }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page2,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page3,
        })

      const pages: RaindropItem[][] = []

      for await (const items of client.fetchAllRaindrops()) {
        pages.push(items)
      }

      expect(pages).toHaveLength(2)
      expect(pages[0]).toHaveLength(50)
      expect(pages[1]).toHaveLength(50)
      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it("should handle rate limiting with delay", async () => {
      // 実際のsetTimeoutを使うが、短い時間で検証
      const mockResponse: RaindropResponse = {
        result: true,
        items: [{ _id: 1 } as RaindropItem],
        count: 1,
      }

      const emptyResponse: RaindropResponse = {
        result: true,
        items: [],
        count: 0,
      }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => emptyResponse,
        })

      const startTime = Date.now()
      const pages: RaindropItem[][] = []

      for await (const items of client.fetchAllRaindrops()) {
        pages.push(items)
      }

      const duration = Date.now() - startTime

      expect(pages).toHaveLength(1)
      // 500msのdelayがあることを確認（多少の誤差を許容）
      expect(duration).toBeGreaterThanOrEqual(400)
    })

    it("should use custom collection ID", async () => {
      const mockResponse: RaindropResponse = {
        result: true,
        items: [],
        count: 0,
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const generator = client.fetchAllRaindrops({ collectionId: 789 })
      await generator.next()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/raindrops/789"),
        expect.any(Object)
      )
    })

    it("should stop when no items returned", async () => {
      const emptyResponse: RaindropResponse = {
        result: true,
        items: [],
        count: 0,
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => emptyResponse,
      })

      const generator = client.fetchAllRaindrops()
      const result = await generator.next()

      expect(result.done).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })
})
