/**
 * Raindrop.io API クライアント
 */

export interface RaindropItem {
  _id: number
  title: string
  link: string
  excerpt: string
  cover: string
  collection: {
    $id: number
  }
  tags: string[]
  created: string // ISO 8601 date
}

export interface RaindropResponse {
  result: boolean
  items: RaindropItem[]
  count: number
}

/**
 * Raindrop APIクライアント
 */
export class RaindropClient {
  private accessToken: string
  private baseUrl = "https://api.raindrop.io/rest/v1"

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * すべてのRaindropを取得
   */
  async getAllRaindrops(options?: {
    collectionId?: number
    page?: number
    perPage?: number
  }): Promise<RaindropResponse> {
    const { collectionId = 0, page = 0, perPage = 50 } = options || {}

    const url = new URL(`${this.baseUrl}/raindrops/${collectionId}`)
    url.searchParams.set("page", page.toString())
    url.searchParams.set("perpage", perPage.toString())

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Raindrop API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 特定のRaindropを取得
   */
  async getRaindrop(raindropId: number): Promise<RaindropItem> {
    const response = await fetch(`${this.baseUrl}/raindrop/${raindropId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Raindrop API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.item
  }

  /**
   * ページネーション対応で全アイテムを取得
   */
  async *fetchAllRaindrops(options?: {
    collectionId?: number
  }): AsyncGenerator<RaindropItem[]> {
    let page = 0
    const perPage = 50
    let hasMore = true

    while (hasMore) {
      const response = await this.getAllRaindrops({
        ...options,
        page,
        perPage,
      })

      if (response.items.length === 0) {
        hasMore = false
        break
      }

      yield response.items
      page++

      // レート制限対策（120リクエスト/分）
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
}
