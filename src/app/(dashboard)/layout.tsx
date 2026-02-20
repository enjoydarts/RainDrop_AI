import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Newspaper,
  FileText,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/Footer"
import { Toaster } from "@/components/Toaster"
import { AblyNotifications } from "@/components/AblyNotifications"
import { MobileMenu } from "@/components/MobileMenu"
import { MoreMenu } from "@/components/MoreMenu"
import { ThemeToggle } from "@/components/ThemeToggle"
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts"
import { handleSignOut } from "./actions"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // ミドルウェアで認証済みなので、ここでは通常 session が存在する
  // 念のため確認
  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* トースト通知 */}
      <Toaster />
      {/* Ablyリアルタイム通知 */}
      <AblyNotifications userId={user.id!} />
      {/* キーボードショートカット */}
      <KeyboardShortcuts />

      {/* ナビゲーションバー */}
      <nav className="bg-white dark:bg-slate-900 shadow-sm dark:shadow-slate-800/50 border-b border-transparent dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center gap-3">
              {/* モバイルメニュー */}
              <MobileMenu userName={user.name} userEmail={user.email} />

              {/* ロゴ */}
              <div className="flex flex-shrink-0 items-center">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Image src="/logo.png" alt="Raindary" width={32} height={32} />
                  <span className="text-xl font-bold text-indigo-600">Raindary</span>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-stretch sm:space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  ダッシュボード
                </Link>
                <Link
                  href="/raindrops"
                  className="inline-flex items-center gap-2 border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <Newspaper className="h-4 w-4" />
                  記事一覧
                </Link>
                <Link
                  href="/summaries"
                  className="inline-flex items-center gap-2 border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <FileText className="h-4 w-4" />
                  要約一覧
                </Link>
                <MoreMenu />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {user.name || user.email}
              </span>
              <form action={handleSignOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

      {/* フッター */}
      <Footer />
    </div>
  )
}
