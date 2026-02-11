import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("raindrop-session")

  console.log("[dashboard] All cookies:", cookieStore.getAll().map(c => c.name))
  console.log("[dashboard] Session cookie exists:", !!sessionCookie)
  console.log("[dashboard] Session cookie value:", sessionCookie?.value.substring(0, 100))

  if (!sessionCookie) {
    console.log("[dashboard] No session cookie, redirecting to /login")
    redirect("/login")
  }

  let session
  try {
    session = JSON.parse(sessionCookie.value)
    console.log("[dashboard] Session parsed successfully for user:", session.email)
  } catch (e) {
    console.log("[dashboard] Failed to parse session cookie:", e)
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              ダッシュボード
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                <p className="font-medium">{session.name}</p>
                <p className="text-gray-500">{session.email}</p>
              </div>
              {session.image && (
                <img
                  src={session.image}
                  alt={session.name}
                  className="h-10 w-10 rounded-full"
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            ようこそ、{session.name}さん！
          </h2>
          <p className="text-gray-600">
            Raindrop.ioとの連携が完了しました。
          </p>
          <div className="mt-6">
            <p className="text-sm text-gray-500">User ID: {session.userId}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              記事の同期
            </h3>
            <p className="text-sm text-gray-600">
              Raindrop.ioから記事を取り込みます
            </p>
            <button className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              同期を開始
            </button>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              要約の生成
            </h3>
            <p className="text-sm text-gray-600">
              AI要約を生成します
            </p>
            <button className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              要約を生成
            </button>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              使用状況
            </h3>
            <p className="text-sm text-gray-600">
              API使用状況を確認します
            </p>
            <button className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              詳細を見る
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
