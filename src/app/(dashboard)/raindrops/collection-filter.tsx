"use client"

import { useState } from "react"
import { Folder, List } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Collection {
  id: number
  name: string
  count: number
}

interface CollectionFilterProps {
  collections: Collection[]
  onFilterChange: (collectionId: number | null) => void
  initialSelectedCollection?: number | null
}

export function CollectionFilter({
  collections,
  onFilterChange,
  initialSelectedCollection = null,
}: CollectionFilterProps) {
  const [selectedCollection, setSelectedCollection] = useState<number | null>(
    initialSelectedCollection
  )

  const handleSelect = (collectionId: number | null) => {
    setSelectedCollection(collectionId)
    onFilterChange(collectionId)
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
        <Folder className="h-4 w-4" />
        コレクション
      </h3>

      <div className="space-y-1">
        {/* すべて表示 */}
        <button
          onClick={() => handleSelect(null)}
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
            selectedCollection === null
              ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <span className="flex items-center gap-2">
            <List className="h-4 w-4" />
            すべて
          </span>
          <Badge
            variant="secondary"
            className={
              selectedCollection === null
                ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }
          >
            {collections.reduce((sum, c) => sum + c.count, 0)}
          </Badge>
        </button>

        {/* コレクション一覧 */}
        {collections.map((collection) => (
          <button
            key={collection.id}
            onClick={() => handleSelect(collection.id)}
            className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              selectedCollection === collection.id
                ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <Folder className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{collection.name}</span>
            </span>
            <Badge
              variant="secondary"
              className={`flex-shrink-0 ${
                selectedCollection === collection.id
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {collection.count}
            </Badge>
          </button>
        ))}
      </div>
    </Card>
  )
}
