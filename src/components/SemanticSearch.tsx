"use client"

import { useState } from "react"
import { Search, Sparkles, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import Link from "next/link"

interface SearchResult {
  summaryId: string
  raindropId: number
  title: string
  summary: string
  rating: number | null
  tone: string
  theme: string | null
  createdAt: string
  similarity: number
}

export function SemanticSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/search/semantic?q=${encodeURIComponent(query)}&limit=10`
      )

      if (!res.ok) {
        throw new Error("検索に失敗しました")
      }

      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 検索入力 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </div>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="意味で検索... (例: 認証について、パフォーマンス改善)"
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              検索
            </>
          )}
        </Button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 検索結果 */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {results.length}件の関連記事が見つかりました
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setResults([])
                setQuery("")
              }}
            >
              クリア
            </Button>
          </div>

          <div className="space-y-3">
            {results.map((result) => (
              <Link key={result.summaryId} href={`/summaries/${result.summaryId}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {result.title}
                        </h4>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {Math.round(result.similarity * 100)}% 一致
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        {result.summary}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {result.theme && (
                          <Badge variant="secondary" className="text-xs">
                            {result.theme}
                          </Badge>
                        )}
                        <span>{result.tone}</span>
                        {result.rating && (
                          <span>{"★".repeat(result.rating)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 検索前の説明 */}
      {results.length === 0 && !error && !isSearching && query.trim() === "" && (
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-indigo-100 p-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                AI意味検索
              </h4>
              <p className="text-sm text-slate-600">
                キーワードの完全一致ではなく、意味が似ている記事を検索します。
                <br />
                例: 「認証」で検索すると、OAuth、JWT、セキュリティ関連の記事がヒットします。
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
