-- Add theme column for automatic categorization (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'summaries' AND column_name = 'theme'
  ) THEN
    ALTER TABLE summaries ADD COLUMN theme text;
  END IF;
END $$;

-- Create index for theme filtering
CREATE INDEX IF NOT EXISTS idx_summaries_theme ON summaries(user_id, theme) WHERE theme IS NOT NULL;
