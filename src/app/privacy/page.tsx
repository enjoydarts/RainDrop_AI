import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
  const lastUpdated = "2026年2月16日"

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ダッシュボードに戻る
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">プライバシーポリシー</CardTitle>
            <CardDescription>最終更新日: {lastUpdated}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h2 className="mb-3 text-2xl font-semibold">1. 個人情報の収集</h2>
              <p className="text-gray-600 mb-3">
                Raindaryは、サービス提供のために以下の情報を収集します。
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">認証情報</h3>
                  <ul className="list-disc space-y-1 pl-6 text-gray-600">
                    <li>Raindrop.io OAuth認証で取得するメールアドレス、名前、プロフィール画像</li>
                    <li>Raindrop.io アクセストークン（暗号化して保存）</li>
                    <li>セッション情報（ログイン状態の維持）</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">記事データ</h3>
                  <ul className="list-disc space-y-1 pl-6 text-gray-600">
                    <li>Raindrop.ioから取得する記事情報（タイトル、URL、説明文、カバー画像、タグ、コレクションID）</li>
                    <li>記事の本文データ（Extract Serviceで抽出）</li>
                    <li>取り込み日時と同期ステータス</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">要約データ</h3>
                  <ul className="list-disc space-y-1 pl-6 text-gray-600">
                    <li>生成された要約テキストとトーン（neutral、snarky、enthusiastic、casual）</li>
                    <li>評価スコア（1-5段階）と評価理由</li>
                    <li>抽出された事実データ（JSON形式）</li>
                    <li>使用したAIモデル名、生成ステータス</li>
                    <li>要約の公開設定（公開/非公開）</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">利用統計</h3>
                  <ul className="list-disc space-y-1 pl-6 text-gray-600">
                    <li>API使用量（プロバイダー名、モデル名、入出力トークン数、コスト）</li>
                    <li>記事取り込み数、要約生成数</li>
                    <li>サービス利用日時</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">2. 個人情報の利用目的</h2>
              <p className="text-gray-600 mb-3">
                収集した個人情報は、以下の目的でのみ利用します。
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-600">
                <li>Raindrop.ioからの記事取り込みと要約生成サービスの提供</li>
                <li>ユーザー認証とセッション管理</li>
                <li>要約の生成、保存、公開機能の提供</li>
                <li>API使用料の計算と統計表示</li>
                <li>サービスの改善と新機能の開発</li>
                <li>技術的な問題のトラブルシューティング</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">3. 第三者サービスとの情報共有</h2>
              <p className="text-gray-600 mb-3">
                サービス提供のため、以下の外部サービスと必要な情報を共有します。
                ユーザーの同意なく、これら以外の第三者に個人情報を提供することはありません。
              </p>

              <div className="space-y-3">
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-semibold">Raindrop.io（OAuth認証、記事データ取得）</h3>
                  <p className="text-sm text-gray-600">
                    共有情報: OAuth認証情報、記事データのリクエスト<br />
                    目的: ブックマーク記事の取得
                  </p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-semibold">Anthropic Claude API（AI要約生成）</h3>
                  <p className="text-sm text-gray-600">
                    共有情報: 記事の本文、抽出された事実データ<br />
                    目的: AI要約の生成（個人を特定する情報は含まれません）
                  </p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-semibold">Extract Service（記事本文抽出、Render上で動作）</h3>
                  <p className="text-sm text-gray-600">
                    共有情報: 記事のURL<br />
                    目的: Web記事からの本文抽出
                  </p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-semibold">Supabase（データベース）</h3>
                  <p className="text-sm text-gray-600">
                    保存情報: すべてのユーザーデータ<br />
                    セキュリティ: SSL/TLS暗号化通信、Row Level Security (RLS) による多層アクセス制御
                  </p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-semibold">Inngest Cloud（バックグラウンドジョブ管理）</h3>
                  <p className="text-sm text-gray-600">
                    共有情報: ジョブ実行のメタデータ（ユーザーID、記事ID、処理ステータス）<br />
                    目的: 非同期処理の管理と監視
                  </p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-semibold">Vercel（ホスティング）</h3>
                  <p className="text-sm text-gray-600">
                    共有情報: アクセスログ、パフォーマンスメトリクス<br />
                    目的: サービスの提供と監視
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">4. データのセキュリティ</h2>
              <ul className="list-disc space-y-2 pl-6 text-gray-600">
                <li>Raindrop.io OAuthアクセストークンは、AES-256-GCM方式で暗号化して保存</li>
                <li>データベース通信はSSL/TLS暗号化</li>
                <li>Row Level Security (RLS) による厳格なアクセス制御（ユーザーは自分のデータのみアクセス可能）</li>
                <li>Auth.js v5 による安全なセッション管理</li>
                <li>環境変数による機密情報の管理</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">5. データの保存期間と削除</h2>
              <p className="text-gray-600 mb-3">
                ユーザーデータは、アカウントが有効な間保存されます。
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-600">
                <li>記事データ: 削除されるまで保存（論理削除フラグで管理）</li>
                <li>要約データ: 削除されるまで保存（論理削除フラグで管理）</li>
                <li>API使用履歴: 無期限保存（統計目的）</li>
                <li>アカウント削除時: すべての関連データ（記事、要約、API使用履歴）を自動的に削除</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">6. 公開要約について</h2>
              <p className="text-gray-600">
                ユーザーが明示的に「公開」設定した要約は、公開URLを通じて誰でも閲覧可能になります。
                公開された要約には記事のタイトル、URL、要約テキスト、トーン、評価が含まれますが、ユーザーの個人情報（名前、メールアドレス）は表示されません。
                公開設定はいつでも非公開に変更できます。
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">7. Cookieの使用</h2>
              <p className="text-gray-600">
                Raindaryは、ログイン状態の維持のためにCookie（セッショントークン）を使用します。
                Cookieを無効にすると、サービスを利用できません。
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">8. プライバシーポリシーの変更</h2>
              <p className="text-gray-600">
                本ポリシーの内容は、法令やサービス内容の変更に応じて予告なく変更される場合があります。
                変更後のポリシーは、本ページに掲載した時点で効力を生じます。
                重要な変更がある場合は、ダッシュボードでお知らせします。
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">9. お問い合わせ</h2>
              <p className="text-gray-600">
                プライバシーポリシーに関するご質問やデータ削除のご要望は、GitHubリポジトリのIssueからお問い合わせください。
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
