ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "facts_extraction_model" text NOT NULL DEFAULT 'claude-haiku-4-5',
  ADD COLUMN IF NOT EXISTS "summary_generation_model" text NOT NULL DEFAULT 'claude-sonnet-4-6';
