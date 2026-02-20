"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Bell, Package, Check, X, BookOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MarkAsReadButton } from "./mark-as-read-button"
import { DeleteButton } from "./delete-button"
import { NotificationTime } from "./notification-time"

const TYPE_ICONS = {
  "import:completed": Package,
  "summary:completed": Check,
  "summary:failed": X,
  "themes:completed": Check,
  "themes:failed": X,
  "digest:completed": BookOpen,
  "digest:failed": X,
} as const

const TYPE_LABELS: Record<string, string> = {
  "import:completed": "取り込み完了",
  "summary:completed": "要約完了",
  "summary:failed": "要約失敗",
  "themes:completed": "分類完了",
  "themes:failed": "分類失敗",
  "digest:completed": "ダイジェスト完了",
  "digest:failed": "ダイジェスト失敗",
}

const TYPE_ORDER = [
  "import:completed",
  "summary:completed",
  "themes:completed",
  "summary:failed",
  "themes:failed",
  "digest:completed",
  "digest:failed",
] as const

const TYPE_STYLES: Record<
  string,
  { iconBg: string; iconText: string; unreadBadge: string }
> = {
  "import:completed": {
    iconBg: "bg-blue-100 dark:bg-blue-950/50",
    iconText: "text-blue-600",
    unreadBadge: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50",
  },
  "summary:completed": {
    iconBg: "bg-green-100 dark:bg-green-950/50",
    iconText: "text-green-600",
    unreadBadge: "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/50",
  },
  "summary:failed": {
    iconBg: "bg-red-100 dark:bg-red-950/50",
    iconText: "text-red-600",
    unreadBadge: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50",
  },
  "themes:completed": {
    iconBg: "bg-green-100 dark:bg-green-950/50",
    iconText: "text-green-600",
    unreadBadge: "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/50",
  },
  "themes:failed": {
    iconBg: "bg-red-100 dark:bg-red-950/50",
    iconText: "text-red-600",
    unreadBadge: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50",
  },
  "digest:completed": {
    iconBg: "bg-indigo-100 dark:bg-indigo-950/50",
    iconText: "text-indigo-600",
    unreadBadge: "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/50",
  },
  "digest:failed": {
    iconBg: "bg-red-100 dark:bg-red-950/50",
    iconText: "text-red-600",
    unreadBadge: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50",
  },
}

interface Notification {
  id: string
  type: string
  title: string
  description: string | null
  data: Record<string, unknown> | null
  isRead: number
  createdAt: Date
}

function getExtraMeta(notification: Notification): string | null {
  if (notification.type === "import:completed") {
    const count =
      typeof notification.data?.extractRequested === "number"
        ? notification.data.extractRequested
        : null
    if (count !== null) {
      return `要約キュー ${count}件`
    }
  }

  if (notification.type === "themes:completed") {
    const count =
      typeof notification.data?.count === "number" ? notification.data.count : null
    if (count !== null) {
      return `分類 ${count}件`
    }
  }

  if (notification.type === "digest:completed") {
    const count =
      typeof notification.data?.summaryCount === "number"
        ? notification.data.summaryCount
        : null
    if (count !== null) {
      return `対象要約 ${count}件`
    }
  }

  return null
}

interface NotificationListProps {
  notifications: Notification[]
}

export function NotificationList({ notifications }: NotificationListProps) {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const filteredNotifications = useMemo(() => {
    let result = notifications
    if (showUnreadOnly) {
      result = result.filter((n) => n.isRead === 0)
    }
    if (typeFilter) {
      result = result.filter((n) => n.type === typeFilter)
    }
    return result
  }, [notifications, showUnreadOnly, typeFilter])

  const unreadCount = notifications.filter((n) => n.isRead === 0).length
  const unreadByType = useMemo(() => {
    const map = new Map<string, number>()
    for (const n of notifications) {
      if (n.isRead !== 0) continue
      map.set(n.type, (map.get(n.type) || 0) + 1)
    }
    return map
  }, [notifications])

  const availableTypes = useMemo(
    () => {
      const existing = new Set(notifications.map((n) => n.type))
      const ordered = TYPE_ORDER.filter((type) => existing.has(type))
      const unknown = Array.from(existing).filter((type) => !TYPE_ORDER.includes(type as any))
      return [...ordered, ...unknown]
    },
    [notifications]
  )

  return (
    <>
      {/* フィルタートグル */}
      {notifications.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={typeFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(null)}
              className={typeFilter === null ? "bg-slate-700 hover:bg-slate-800" : ""}
            >
              すべて
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            {availableTypes.map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(type)}
                className={typeFilter === type ? "bg-slate-700 hover:bg-slate-800" : ""}
              >
                {TYPE_LABELS[type] || type}
                {(unreadByType.get(type) || 0) > 0 && (
                  <Badge className="ml-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700">
                    {unreadByType.get(type)}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={showUnreadOnly ? "bg-indigo-600 hover:bg-indigo-700" : ""}
          >
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            未読のみ表示
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 hover:bg-white dark:hover:bg-slate-700">
                {unreadCount}
              </Badge>
            )}
          </Button>
          </div>
        </div>
      )}

      {/* 通知一覧 */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <Bell className="h-12 w-12 sm:h-16 sm:w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-slate-500">
              {showUnreadOnly ? "未読の通知はありません" : "通知はありません"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type as keyof typeof TYPE_ICONS] || Bell
            const isUnread = notification.isRead === 0
            const extraMeta = getExtraMeta(notification)
            const style = TYPE_STYLES[notification.type] || {
              iconBg: "bg-slate-100 dark:bg-slate-800",
              iconText: "text-slate-600",
              unreadBadge: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
            }

            return (
              <Card
                key={notification.id}
                className={`card-hover ${isUnread ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20" : ""}`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* アイコン */}
                    <div
                      className={`flex-shrink-0 rounded-lg p-2 sm:p-3 ${style.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${style.iconText}`} />
                    </div>

                    {/* コンテンツ */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                          {notification.title}
                        </h3>
                        {isUnread && (
                          <Badge
                            variant="secondary"
                            className={`${style.unreadBadge} text-xs sm:text-sm flex-shrink-0`}
                          >
                            未読
                          </Badge>
                        )}
                      </div>
                      {notification.description && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {notification.description}
                        </p>
                      )}
                      {extraMeta && (
                        <div className="mb-3">
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                            {extraMeta}
                          </Badge>
                        </div>
                      )}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <NotificationTime createdAt={notification.createdAt} />
                        <div className="flex items-center gap-2">
                          {typeof notification.data?.summaryId === "string" && (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/summaries/${notification.data.summaryId}`}>
                                詳細へ
                              </Link>
                            </Button>
                          )}
                          {isUnread && (
                            <MarkAsReadButton notificationId={notification.id} />
                          )}
                          <DeleteButton notificationId={notification.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
