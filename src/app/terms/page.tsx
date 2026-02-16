import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  const lastUpdated = "2026年2月16日"

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ダッシュボードに戻る
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">利用規約</CardTitle>
            <CardDescription>最終更新日: {lastUpdated}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h2 className="mb-3 text-2xl font-semibold">第1条（適用）</h2>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>
                  本規約は、Raindary（以下「本サービス」）の提供者（以下「当方」）とユーザーとの間の、本サービスの利用に関する一切の関係に適用されます。
                </li>
                <li>
                  ユーザーは、本サービスを利用することにより、本規約に同意したものとみなされます。
                </li>
                <li>
                  本サービスは、MITライセンスの下で公開されているオープンソースソフトウェアですが、本規約は本サービスの利用に関する条件を定めるものです。
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第2条（サービスの内容）</h2>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>
                  本サービスは、Raindrop.ioに保存されたブックマーク記事を自動取り込みし、Anthropic Claude APIを用いてAI要約を生成する機能を提供します。
                </li>
                <li>
                  本サービスは、以下の機能を含みます：
                  <ul className="list-disc space-y-1 pl-6 mt-2">
                    <li>Raindrop.io OAuth認証によるログイン</li>
                    <li>記事の自動取り込みと同期</li>
                    <li>4種類のトーン（neutral、snarky、enthusiastic、casual）での要約生成</li>
                    <li>要約の保存、閲覧、公開機能</li>
                    <li>API使用量とコストの統計表示</li>
                    <li>コレクション別フィルタリングと検索機能</li>
                  </ul>
                </li>
                <li>
                  本サービスの機能は、予告なく追加、変更、削除される場合があります。
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第3条（アカウント）</h2>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>
                  ユーザーは、Raindrop.io OAuthを使用して本サービスにログインする必要があります。
                </li>
                <li>
                  ユーザーは、自己の責任においてRaindrop.ioアカウントを管理するものとし、これを第三者に利用させてはなりません。
                </li>
                <li>
                  本サービスは、Raindrop.ioアカウントのアクセストークンを暗号化して保存します。ユーザーがRaindrop.io側でアプリ連携を解除した場合、本サービスへのアクセスができなくなります。
                </li>
                <li>
                  ユーザーは、いつでもアカウントを削除できます。アカウント削除時には、すべてのデータ（記事、要約、API使用履歴）が自動的に削除されます。
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第4条（禁止事項）</h2>
              <p className="text-slate-600 mb-3">
                ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
              </p>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為、または犯罪を助長・促進する行為</li>
                <li>当方または第三者の知的財産権、肖像権、プライバシー権、名誉その他の権利または利益を侵害する行為</li>
                <li>本サービスのネットワークまたはシステムに過度な負荷をかける行為</li>
                <li>本サービスの運営を妨害する行為、または妨害するおそれのある行為</li>
                <li>本サービスのセキュリティを脅かす行為、不正アクセス行為</li>
                <li>著作権で保護された記事を不正に取得・要約する行為</li>
                <li>生成されたAI要約を、元記事の著作権を侵害する形で利用する行為</li>
                <li>APIを不正に利用して大量のリクエストを送信する行為</li>
                <li>リバースエンジニアリング、逆コンパイル、逆アセンブル等の行為</li>
                <li>他のユーザーのアカウントを不正に使用する行為</li>
                <li>その他、当方が不適切と判断する行為</li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第5条（要約の公開機能）</h2>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>
                  ユーザーは、生成した要約を公開URLで外部に共有できます。公開設定は要約ごとに個別に設定できます。
                </li>
                <li>
                  公開された要約は、URLを知る誰でも閲覧可能になります。ユーザーの個人情報（名前、メールアドレス）は公開されません。
                </li>
                <li>
                  ユーザーは、公開した要約について、元記事の著作権を尊重し、フェアユースの範囲内で利用する責任を負います。
                </li>
                <li>
                  当方は、公開された要約の内容について一切の責任を負いません。
                </li>
                <li>
                  当方は、法令違反または第三者の権利を侵害すると判断した公開要約を、予告なく削除または非公開にすることができます。
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第6条（AI生成コンテンツの利用）</h2>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>
                  本サービスは、Anthropic Claude APIを使用してAI要約を生成します。
                </li>
                <li>
                  生成された要約の著作権は、ユーザーに帰属します。ただし、元記事の著作権はその著作者に帰属します。
                </li>
                <li>
                  ユーザーは、生成された要約を自由に利用できますが、元記事の著作権を侵害しないよう注意する責任を負います。
                </li>
                <li>
                  本サービスは、記事の本文をAnthropic Claude APIに送信します。ユーザーは、この処理に同意したものとみなされます。
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第7条（外部サービスの利用）</h2>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>
                  本サービスは、以下の外部サービスを利用します：
                  <ul className="list-disc space-y-1 pl-6 mt-2">
                    <li>Raindrop.io（記事データ取得）</li>
                    <li>Anthropic Claude API（AI要約生成）</li>
                    <li>Extract Service（記事本文抽出、Render上で動作）</li>
                    <li>Supabase（データベース）</li>
                    <li>Inngest Cloud（バックグラウンドジョブ管理）</li>
                    <li>Vercel（ホスティング）</li>
                  </ul>
                </li>
                <li>
                  これらの外部サービスの利用規約やプライバシーポリシーにも従う必要があります。
                </li>
                <li>
                  外部サービスの障害や停止により本サービスが利用できない場合、当方は一切の責任を負いません。
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第8条（サービスの停止・変更・終了）</h2>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>
                  当方は、以下の場合、事前の通知なく本サービスの全部または一部の提供を停止または中断することができます：
                  <ul className="list-disc space-y-1 pl-6 mt-2">
                    <li>システムの保守、点検、修理を行う場合</li>
                    <li>地震、停電、天災等の不可抗力により提供が困難な場合</li>
                    <li>外部サービスの障害により提供が困難な場合</li>
                    <li>その他、当方が停止または中断を必要と判断した場合</li>
                  </ul>
                </li>
                <li>
                  当方は、本サービスの内容を予告なく変更することができます。
                </li>
                <li>
                  当方は、本サービスを終了する場合、可能な限り事前に通知します。
                </li>
                <li>
                  本条に基づく措置によりユーザーに生じた損害について、当方は一切の責任を負いません。
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第9条（免責事項）</h2>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>
                  本サービスは、AI生成による要約を提供するものであり、その正確性、完全性、有用性、安全性を保証するものではありません。
                </li>
                <li>
                  生成された要約の品質、内容、適法性について、当方は一切の責任を負いません。
                </li>
                <li>
                  本サービスの利用により生じた直接的または間接的な損害（逸失利益、データの損失、業務の中断等を含む）について、当方は一切の責任を負いません。
                </li>
                <li>
                  本サービスは「現状有姿」で提供され、明示的または黙示的な保証（商品性、特定目的への適合性等）を行いません。
                </li>
                <li>
                  本サービスは、オープンソースプロジェクトとして提供されており、無償で利用できます。これに伴い、当方は最小限の保証のみを提供します。
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第10条（知的財産権）</h2>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>
                  本サービスのソースコードは、MITライセンスの下で公開されています。
                </li>
                <li>
                  本サービスに関する著作権、商標権その他の知的財産権は、当方または正当な権利者に帰属します。
                </li>
                <li>
                  ユーザーが本サービスを利用して生成した要約の著作権は、ユーザーに帰属します。
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第11条（規約の変更）</h2>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>
                  当方は、必要に応じて本規約を変更することができます。
                </li>
                <li>
                  変更後の規約は、本サービス上に掲載した時点で効力を生じます。
                </li>
                <li>
                  重要な変更がある場合は、ダッシュボードでお知らせします。
                </li>
                <li>
                  変更後も本サービスを継続して利用することにより、ユーザーは変更後の規約に同意したものとみなされます。
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第12条（準拠法・管轄）</h2>
              <ol className="list-decimal space-y-2 pl-6 text-slate-600">
                <li>
                  本規約の解釈にあたっては、日本法を準拠法とします。
                </li>
                <li>
                  本サービスに関して紛争が生じた場合、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
                </li>
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-2xl font-semibold">第13条（お問い合わせ）</h2>
              <p className="text-slate-600">
                本規約に関するご質問や、本サービスに関するお問い合わせは、GitHubリポジトリのIssueからお問い合わせください。
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
