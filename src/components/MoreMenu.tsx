"use client"

import Link from "next/link"
import { MoreHorizontal, Tag, BriefcaseBusiness, BarChart3, Bell, Settings, BookOpen } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
const MORE_ITEMS = [
  { href: "/themes", icon: Tag, label: "テーマ管理" },
  { href: "/digests", icon: BookOpen, label: "ダイジェスト" },
  { href: "/jobs", icon: BriefcaseBusiness, label: "ジョブ管理" },
  { href: "/stats", icon: BarChart3, label: "統計" },
  { href: "/notifications", icon: Bell, label: "通知" },
  { href: "/settings", icon: Settings, label: "設定" },
]

export function MoreMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-200 outline-none">
        <MoreHorizontal className="h-4 w-4" />
        その他
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {MORE_ITEMS.map(({ href, icon: Icon, label }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href} className="flex items-center gap-2 cursor-pointer">
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
