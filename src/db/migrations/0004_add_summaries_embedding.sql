-- Add embedding column to summaries table for related article recommendations
ALTER TABLE "summaries" ADD COLUMN "embedding" JSONB;

-- Add index for faster similarity searches (optional, for future optimization)
CREATE INDEX IF NOT EXISTS "idx_summaries_embedding" ON "summaries" USING GIN ("embedding");
