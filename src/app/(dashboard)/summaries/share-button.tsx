"use client"

import { useState } from "react"
import { Copy, Check, EyeOff, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ShareButtonProps {
  summaryId: string
  isPublic: boolean
  onToggle: () => Promise<void>
}

export function ShareButton({ summaryId, isPublic, onToggle }: ShareButtonProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleTogglePublic = async () => {
    setLoading(true)
    try {
      await onToggle()
    } catch (error) {
      console.error("[ShareButton] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/share/${summaryId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("[ShareButton] Failed to copy:", error)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {isPublic ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      リンクをコピー
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>共有リンクをコピー</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleTogglePublic}
                  disabled={loading}
                  className="bg-slate-600 hover:bg-slate-700"
                >
                  <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                  非公開にする
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>要約を非公開にする</p>
              </TooltipContent>
            </Tooltip>
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={handleTogglePublic}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                共有する
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>要約を公開して共有リンクを生成</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
