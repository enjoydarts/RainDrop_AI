"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const TONE_LABELS: Record<string, string> = {
  neutral: "客観的",
  snarky: "毒舌",
  enthusiastic: "熱量高め",
  casual: "カジュアル",
}

interface CopyMarkdownButtonProps {
  title: string | null
  tone: string
  theme: string | null
  rating: number | null
  summary: string | null
  articleLink: string | null
  createdAt: Date
}

export function CopyMarkdownButton({
  title,
  tone,
  theme,
  rating,
  summary,
  articleLink,
  createdAt,
}: CopyMarkdownButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ratingStr = rating
      ? `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`
      : ""
    const lines = [
      `## ${title || "無題"}`,
      ``,
      `- **トーン:** ${TONE_LABELS[tone] || tone}`,
      theme ? `- **テーマ:** ${theme}` : null,
      ratingStr ? `- **評価:** ${ratingStr}` : null,
      `- **日付:** ${new Date(createdAt).toLocaleDateString("ja-JP")}`,
      articleLink ? `- **元記事:** ${articleLink}` : null,
      ``,
      summary || "",
    ]
      .filter((l) => l !== null)
      .join("\n")

    await navigator.clipboard.writeText(lines)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2 text-green-600" />
          コピー済み
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Markdownコピー
        </>
      )}
    </Button>
  )
}
