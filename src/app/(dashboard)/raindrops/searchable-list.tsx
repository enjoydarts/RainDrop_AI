"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { Search, X, Calendar, Tag, Newspaper } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  summaryCountMap?: Map<number, number>
  initialCollectionId?: number | null
  initialSearchQuery?: string
}

export function SearchableList({
  items,
  collectionMap = new Map(),
  summaryCountMap = new Map(),
  initialCollectionId = null,
  initialSearchQuery = "",
}: SearchableListProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [selectedCollection, setSelectedCollection] = useState<number | null>(initialCollectionId)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // タグ一覧を生成
  const availableTags = useMemo(() => {
    const tagCountMap = new Map<string, number>()
    items.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        (item.tags as string[]).forEach((tag) => {
          tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1)
        })
      }
    })
    return Array.from(tagCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
  }, [items])

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

  // 検索・コレクション・タグフィルタリング
  const filteredItems = useMemo(() => {
    let result = items

    // コレクションフィルタ
    if (selectedCollection !== null) {
      result = result.filter((item) => item.collectionId === selectedCollection)
    }

    // タグフィルタ
    if (selectedTag !== null) {
      result = result.filter((item) => {
        if (!item.tags || !Array.isArray(item.tags)) return false
        return (item.tags as string[]).includes(selectedTag)
      })
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
  }, [items, searchQuery, selectedCollection, selectedTag])

  useEffect(() => {
    if (typeof window === "undefined") return
    const hash = window.location.hash
    if (!hash) return

    const targetId = hash.replace(/^#/, "")
    let attempts = 0

    const tryScroll = () => {
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        return true
      }
      return false
    }

    if (tryScroll()) return

    const timer = window.setInterval(() => {
      attempts += 1
      if (tryScroll() || attempts >= 10) {
        window.clearInterval(timer)
      }
    }, 200)

    return () => window.clearInterval(timer)
  }, [filteredItems])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* サイドバー（コレクションフィルタ） */}
      {collections.length > 0 && (
        <div className="lg:col-span-1">
          <CollectionFilter
            collections={collections}
            onFilterChange={setSelectedCollection}
            initialSelectedCollection={initialCollectionId}
          />
        </div>
      )}

      {/* メインコンテンツ */}
      <div className={`space-y-4 ${collections.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}`}>
        {/* 検索バー */}
        <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="タイトル、本文、タグで検索..."
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 h-full px-3 hover:bg-transparent"
          >
            <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
          </Button>
        )}
      </div>

      {/* タグフィルター */}
      {availableTags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedTag(null)}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              selectedTag === null
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
            }`}
          >
            <Tag className="h-3 w-3" />
            すべて
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedTag === tag
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
              }`}
            >
              <Tag className="h-3 w-3" />
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 検索結果件数 */}
      {(searchQuery || selectedTag) && (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {filteredItems.length}件の記事が見つかりました
        </div>
      )}

      {/* 記事リスト */}
      {filteredItems.length === 0 ? (
        <Card>
          <div className="px-4 py-16 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
              検索結果が見つかりませんでした
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              別のキーワードで検索してみてください。
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const formatDate = (date: Date) => {
              return new Date(date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
                timeZone: "Asia/Tokyo"
              })
            }

            return (
              <div
                key={item.id}
                id={`raindrop-${item.id}`}
                className="group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm card-hover"
              >
                {/* カバー画像（上部・大きく） */}
                {item.cover ? (
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={item.cover}
                      alt=""
                      fill
                      className="object-cover image-hover-zoom"
                    />
                    {/* 日付バッジ（画像上） */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-900/90">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(item.createdAtRemote)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-slate-300" />
                  </div>
                )}

                {/* コンテンツエリア */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-2 hover:text-indigo-600 transition-colors">
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  </h3>

                  {item.excerpt && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                      {item.excerpt}
                    </p>
                  )}

                  {/* タグ */}
                  {item.tags && Array.isArray(item.tags) && (item.tags as string[]).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(item.tags as string[]).slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className={`text-xs cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors ${
                            selectedTag === tag ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" : ""
                          }`}
                          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {/* アクションボタン */}
                  <div className="flex flex-wrap items-center gap-2">
                    <SummaryButton raindropId={item.id} />
                    <DeleteButton raindropId={item.id} articleTitle={item.title} />
                    {(summaryCountMap.get(item.id) ?? 0) > 0 && (
                      <Badge
                        variant="outline"
                        className="ml-auto shrink-0 whitespace-nowrap text-xs text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50"
                      >
                        {summaryCountMap.get(item.id)}トーン
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
