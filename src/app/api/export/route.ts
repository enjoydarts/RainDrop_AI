import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { summaries, raindrops } from "@/db/schema"
import { eq, and, isNull, inArray } from "drizzle-orm"
import { checkRateLimit } from "@/lib/rate-limit"

const TONE_LABELS: Record<string, string> = {
  neutral: "客観的",
  snarky: "毒舌",
  enthusiastic: "熱量高め",
  casual: "カジュアル",
}

/**
 * 要約エクスポート API
 * GET /api/export?format=markdown|json|csv&theme=...&tone=...&rating=...
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const rateLimitResponse = await checkRateLimit(req, userId)
  if (rateLimitResponse) return rateLimitResponse

  const { searchParams } = req.nextUrl
  const format = searchParams.get("format") || "markdown"
  const themeFilter = searchParams.get("theme")
  const toneFilter = searchParams.get("tone")
  const ratingFilter = searchParams.get("rating")

  // 条件構築
  const conditions = [
    eq(summaries.userId, userId),
    eq(summaries.status, "completed"),
    isNull(summaries.deletedAt),
  ]
  if (themeFilter) conditions.push(eq(summaries.theme, themeFilter))
  if (toneFilter) conditions.push(eq(summaries.tone, toneFilter as "neutral" | "snarky" | "enthusiastic" | "casual"))
  if (ratingFilter) conditions.push(eq(summaries.rating, Number(ratingFilter)))

  const rows = await db
    .select({
      id: summaries.id,
      summary: summaries.summary,
      tone: summaries.tone,
      theme: summaries.theme,
      rating: summaries.rating,
      createdAt: summaries.createdAt,
      articleTitle: raindrops.title,
      articleLink: raindrops.link,
    })
    .from(summaries)
    .innerJoin(
      raindrops,
      and(eq(summaries.raindropId, raindrops.id), eq(summaries.userId, raindrops.userId))
    )
    .where(and(...conditions))
    .orderBy(summaries.createdAt)
    .limit(1000)

  const now = new Date().toISOString().split("T")[0]

  if (format === "json") {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="raindary-summaries-${now}.json"`,
      },
    })
  }

  if (format === "csv") {
    const header = "id,title,tone,theme,rating,created_at,link,summary\n"
    const csvRows = rows.map((r) => {
      const escape = (v: string | null | undefined) =>
        `"${(v || "").replace(/"/g, '""').replace(/\n/g, " ")}"`
      return [
        escape(r.id),
        escape(r.articleTitle),
        escape(TONE_LABELS[r.tone] || r.tone),
        escape(r.theme),
        r.rating ?? "",
        r.createdAt.toISOString(),
        escape(r.articleLink),
        escape(r.summary),
      ].join(",")
    })
    return new NextResponse(header + csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="raindary-summaries-${now}.csv"`,
      },
    })
  }

  // Markdown (default)
  const lines = rows.map((r) => {
    const tone = TONE_LABELS[r.tone] || r.tone
    const rating = r.rating ? `${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}` : ""
    return [
      `## ${r.articleTitle || "無題"}`,
      ``,
      `- **トーン:** ${tone}`,
      r.theme ? `- **テーマ:** ${r.theme}` : null,
      rating ? `- **評価:** ${rating}` : null,
      `- **日付:** ${r.createdAt.toLocaleDateString("ja-JP")}`,
      r.articleLink ? `- **元記事:** ${r.articleLink}` : null,
      ``,
      r.summary,
      ``,
      `---`,
      ``,
    ]
      .filter((l) => l !== null)
      .join("\n")
  })

  const markdown = `# Raindary エクスポート (${now})\n\n` + lines.join("\n")

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="raindary-summaries-${now}.md"`,
    },
  })
}
