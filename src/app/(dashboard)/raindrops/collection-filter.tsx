"use client"

import { useState } from "react"

interface Collection {
  id: number
  name: string
  count: number
}

interface CollectionFilterProps {
  collections: Collection[]
  onFilterChange: (collectionId: number | null) => void
}

export function CollectionFilter({ collections, onFilterChange }: CollectionFilterProps) {
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null)

  const handleSelect = (collectionId: number | null) => {
    setSelectedCollection(collectionId)
    onFilterChange(collectionId)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        コレクション
      </h3>

      <div className="space-y-1">
        {/* すべて表示 */}
        <button
          onClick={() => handleSelect(null)}
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
            selectedCollection === null
              ? "bg-indigo-50 text-indigo-700 font-medium"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            すべて
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              selectedCollection === null
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {collections.reduce((sum, c) => sum + c.count, 0)}
          </span>
        </button>

        {/* コレクション一覧 */}
        {collections.map((collection) => (
          <button
            key={collection.id}
            onClick={() => handleSelect(collection.id)}
            className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              selectedCollection === collection.id
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <span className="truncate">{collection.name}</span>
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                selectedCollection === collection.id
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {collection.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
