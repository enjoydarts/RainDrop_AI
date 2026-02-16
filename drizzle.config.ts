import type { Config } from "drizzle-kit"

// ビルド時はTRANSACTION_POOLER（IPv4対応）を優先使用
// ランタイムはDATABASE_URL（Direct connection、RLS対応）を使用
const dbUrl = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL

if (!dbUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_POOLER environment variable is not set")
}

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
} satisfies Config
