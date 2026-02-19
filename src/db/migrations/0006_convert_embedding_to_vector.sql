-- Convert embedding column from jsonb to vector type (idempotent)

-- Step 1: Add new vector column (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'summaries' AND column_name = 'embedding_vector'
  ) THEN
    ALTER TABLE summaries ADD COLUMN embedding_vector vector(1536);
  END IF;
END $$;

-- Step 2: Convert existing jsonb embeddings to vector
-- Only convert if jsonb embedding column still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'summaries' AND column_name = 'embedding' AND data_type = 'jsonb'
  ) THEN
    UPDATE summaries
    SET embedding_vector = (
      SELECT ('[' || string_agg(value::text, ',') || ']')::vector
      FROM jsonb_array_elements(embedding) AS value
    )
    WHERE embedding IS NOT NULL
      AND jsonb_typeof(embedding) = 'array'
      AND embedding_vector IS NULL;
  END IF;
END $$;

-- Step 3: Drop old jsonb column and rename new column (only if not already done)
DO $$
BEGIN
  -- Drop old JSONB column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'summaries' AND column_name = 'embedding' AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE summaries DROP COLUMN embedding;
  END IF;

  -- Rename embedding_vector to embedding only if embedding doesn't already exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'summaries' AND column_name = 'embedding_vector'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'summaries' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE summaries RENAME COLUMN embedding_vector TO embedding;
  END IF;
END $$;

-- Step 4: Create index for vector similarity search (cosine distance)
-- Using HNSW index (better memory efficiency and accuracy than ivfflat)
CREATE INDEX IF NOT EXISTS idx_summaries_embedding_hnsw
  ON summaries USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
