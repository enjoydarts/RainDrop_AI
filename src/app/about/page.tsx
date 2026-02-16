import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Sparkles, Database, Zap, Lock, Share2, BarChart3 } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ダッシュボードに戻る
          </Link>
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Raindaryについて</CardTitle>
              <p className="text-muted-foreground">
                自分語り要約 - 読んだフリができるAI要約ツール
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <section>
                <h2 className="mb-3 text-2xl font-semibold">Raindaryとは</h2>
                <p className="text-slate-600 leading-relaxed">
                  Raindaryは、Raindrop.ioに保存した記事を自動的に取り込み、Anthropic Claude APIを使って「読んだフリができる自分語り要約」を生成するツールです。
                  技術記事を大量に保存するが読み切れないエンジニアのために、高品質なAI要約で効率的な情報キャッチアップを実現します。
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="mb-4 text-2xl font-semibold">主な機能</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">4種類の要約トーン</h3>
                      <p className="text-sm text-slate-600">
                        neutral（客観的）、snarky（毒舌）、enthusiastic（熱量高め）、casual（カジュアル）から選択可能
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Database className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">自動記事取り込み</h3>
                      <p className="text-sm text-slate-600">
                        Raindrop.io OAuth連携により、ワンクリックでブックマークを同期
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Zap className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">3段階処理パイプライン</h3>
                      <p className="text-sm text-slate-600">
                        記事本文抽出（Python + trafilatura on Render） → 事実抽出（Haiku） → 要約生成（Sonnet）
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Share2 className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">要約の共有機能</h3>
                      <p className="text-sm text-slate-600">
                        生成した要約を公開URLで外部に共有（公開/非公開切り替え可能）
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <BarChart3 className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">統計ダッシュボード</h3>
                      <p className="text-sm text-slate-600">
                        記事数、要約数、月間API使用料、トーン分布を可視化
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Lock className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">セキュアなデータ管理</h3>
                      <p className="text-sm text-slate-600">
                        OAuth トークンは暗号化して保存、マルチユーザー対応のRLS実装
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="mb-4 text-2xl font-semibold">技術スタック</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-slate-700">フロントエンド</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Next.js 16</Badge>
                      <Badge variant="secondary">React 19</Badge>
                      <Badge variant="secondary">TypeScript</Badge>
                      <Badge variant="secondary">Tailwind CSS</Badge>
                      <Badge variant="secondary">shadcn/ui</Badge>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-slate-700">バックエンド</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Auth.js v5</Badge>
                      <Badge variant="secondary">Drizzle ORM</Badge>
                      <Badge variant="secondary">PostgreSQL</Badge>
                      <Badge variant="secondary">Inngest</Badge>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-slate-700">AI / 外部サービス</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Claude Sonnet 4.5</Badge>
                      <Badge variant="secondary">Claude Haiku 4.5</Badge>
                      <Badge variant="secondary">Raindrop.io API</Badge>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-slate-700">記事抽出サービス</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Python + FastAPI</Badge>
                      <Badge variant="secondary">trafilatura</Badge>
                      <Badge variant="secondary">Render (デプロイ)</Badge>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-slate-700">インフラ</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Vercel (Next.js)</Badge>
                      <Badge variant="secondary">Supabase (PostgreSQL)</Badge>
                      <Badge variant="secondary">Inngest Cloud (ジョブ管理)</Badge>
                      <Badge variant="secondary">Render (Extract Service)</Badge>
                      <Badge variant="secondary">Docker Compose (ローカル開発)</Badge>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="mb-3 text-2xl font-semibold">オープンソース</h2>
                <p className="text-slate-600 leading-relaxed mb-3">
                  Raindaryは、MITライセンスの下で公開されているオープンソースプロジェクトです。
                  GitHubでソースコードを公開しており、継続的に改善を続けています。
                </p>
                <p className="text-sm text-slate-500">
                  Created by Minoru Kitayama
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
