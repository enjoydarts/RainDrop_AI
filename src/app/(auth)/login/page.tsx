import { signIn } from "@/auth"
import { redirect } from "next/navigation"
import Image from "next/image"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const error = params.error

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Image src="/logo.png" alt="Raindary" width={80} height={80} />
          </div>
          <h1 className="mb-2 text-4xl font-bold text-slate-900">Raindary</h1>
          <p className="text-slate-600">自分語り要約ツール</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  ログインエラー
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    {typeof error === "string"
                      ? decodeURIComponent(error)
                      : "ログインに失敗しました"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <form
            action={async () => {
              "use server"
              await signIn("raindrop", { redirectTo: "/dashboard" })
            }}
          >
            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Raindrop.ioでログイン
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            <p>
              ログインすると、Raindrop.ioの記事を自動で取り込み、
              <br />
              AI要約を生成できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
