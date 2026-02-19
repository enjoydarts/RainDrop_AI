-- Add user sync metadata and budget guardrail columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'raindrop_last_imported_at'
  ) THEN
    ALTER TABLE "user" ADD COLUMN raindrop_last_imported_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'monthly_budget_usd'
  ) THEN
    ALTER TABLE "user" ADD COLUMN monthly_budget_usd numeric(10,2);
  END IF;
END $$;

-- Add user feedback columns for summary quality loop
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'summaries' AND column_name = 'user_rating'
  ) THEN
    ALTER TABLE summaries ADD COLUMN user_rating integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'summaries' AND column_name = 'user_feedback'
  ) THEN
    ALTER TABLE summaries ADD COLUMN user_feedback text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_summaries_user_rating ON summaries(user_id, user_rating)
WHERE user_rating IS NOT NULL;
