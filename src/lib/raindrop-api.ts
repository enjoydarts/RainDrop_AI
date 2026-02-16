import { decrypt } from "./crypto"

/**
 * Raindrop.io APIクライアント
 */

interface RaindropCollection {
  _id: number
  title: string
  count: number
  cover?: string[]
  sort?: number
  expanded?: boolean
  public?: boolean
  view?: string
  creatorRef?: {
    _id: number
  }
}

interface CollectionsResponse {
  items: RaindropCollection[]
}

/**
 * ユーザーのコレクション一覧を取得
 * @param encryptedAccessToken 暗号化されたアクセストークン
 */
export async function getRaindropCollections(
  encryptedAccessToken: string
): Promise<RaindropCollection[]> {
  try {
    // トークンを復号化
    const accessToken = decrypt(encryptedAccessToken)

    // Raindrop.io APIを呼び出し
    const response = await fetch("https://api.raindrop.io/rest/v1/collections", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: {
        // 1時間キャッシュ（コレクション名はそう頻繁に変わらない）
        revalidate: 3600,
      },
    })

    if (!response.ok) {
      console.error("[getRaindropCollections] API error:", response.status)
      return []
    }

    const data: CollectionsResponse = await response.json()
    return data.items || []
  } catch (error) {
    console.error("[getRaindropCollections] Error:", error)
    return []
  }
}

/**
 * コレクションIDから名前を取得するマップを作成
 */
export function createCollectionMap(
  collections: RaindropCollection[]
): Map<number, string> {
  const map = new Map<number, string>()

  collections.forEach((collection) => {
    map.set(collection._id, collection.title)
  })

  return map
}
