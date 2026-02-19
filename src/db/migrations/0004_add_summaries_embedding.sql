-- Add embedding column to summaries table for related article recommendations (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'summaries' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE "summaries" ADD COLUMN "embedding" JSONB;
  END IF;
END $$;

-- Add GIN index for JSONB embedding (only if column is still JSONB type)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'summaries' AND column_name = 'embedding' AND data_type = 'jsonb'
  ) THEN
    CREATE INDEX IF NOT EXISTS "idx_summaries_embedding" ON "summaries" USING GIN ("embedding");
  END IF;
END $$;
