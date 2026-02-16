"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { SummaryButton } from "./summary-button"
import { DeleteButton } from "./delete-button"
import { CollectionFilter } from "./collection-filter"

interface Raindrop {
  id: number
  title: string
  link: string
  excerpt: string | null
  cover: string | null
  tags: unknown
  collectionId: number | null
  createdAtRemote: Date
}

interface SearchableListProps {
  items: Raindrop[]
  collectionMap?: Map<number, string>
}

export function SearchableList({ items, collectionMap = new Map() }: SearchableListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null)

  // コレクション一覧を生成
  const collections = useMemo(() => {
    const collectionCountMap = new Map<number, number>()

    items.forEach((item) => {
      if (item.collectionId !== null) {
        const count = collectionCountMap.get(item.collectionId) || 0
        collectionCountMap.set(item.collectionId, count + 1)
      }
    })

    return Array.from(collectionCountMap.entries())
      .map(([id, count]) => ({
        id,
        name: collectionMap.get(id) || `Collection ${id}`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
  }, [items, collectionMap])

  // 検索・コレクションフィルタリング
  const filteredItems = useMemo(() => {
    let result = items

    // コレクションフィルタ
    if (selectedCollection !== null) {
      result = result.filter((item) => item.collectionId === selectedCollection)
    }

    // 検索フィルタ
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => {
        // タイトルで検索
        if (item.title.toLowerCase().includes(query)) {
          return true
        }

        // 本文で検索
        if (item.excerpt && item.excerpt.toLowerCase().includes(query)) {
          return true
        }

        // タグで検索
        if (item.tags && Array.isArray(item.tags)) {
          const tags = item.tags as string[]
          if (tags.some((tag) => tag.toLowerCase().includes(query))) {
            return true
          }
        }

        return false
      })
    }

    return result
  }, [items, searchQuery, selectedCollection])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* サイドバー（コレクションフィルタ） */}
      {collections.length > 0 && (
        <div className="lg:col-span-1">
          <CollectionFilter
            collections={collections}
            onFilterChange={setSelectedCollection}
          />
        </div>
      )}

      {/* メインコンテンツ */}
      <div className={`space-y-4 ${collections.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}`}>
        {/* 検索バー */}
        <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="タイトル、本文、タグで検索..."
          className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 検索結果件数 */}
      {searchQuery && (
        <div className="text-sm text-gray-600">
          {filteredItems.length}件の記事が見つかりました
        </div>
      )}

      {/* 記事リスト */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-16 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              検索結果が見つかりませんでした
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              別のキーワードで検索してみてください。
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <ul className="divide-y divide-gray-100">
            {filteredItems.map((item) => (
              <li key={item.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2"
                    >
                      {item.title}
                    </a>
                    {item.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
                        {item.excerpt}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {new Date(item.createdAtRemote).toLocaleDateString("ja-JP")}
                      </span>
                      {item.tags &&
                      Array.isArray(item.tags) &&
                      (item.tags as unknown[]).length > 0 ? (
                        <span className="flex items-center gap-1" suppressHydrationWarning>
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          {String((item.tags as unknown as string[]).slice(0, 3).join(", "))}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <SummaryButton raindropId={item.id} />
                      <DeleteButton raindropId={item.id} articleTitle={item.title} />
                    </div>
                  </div>
                  {item.cover && (
                    <Image
                      src={item.cover}
                      alt=""
                      width={96}
                      height={96}
                      className="ml-4 h-24 w-24 flex-shrink-0 rounded-lg object-cover border border-gray-200"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </div>
  )
}
