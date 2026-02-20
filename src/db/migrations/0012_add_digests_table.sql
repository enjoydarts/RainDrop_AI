CREATE TABLE IF NOT EXISTS "digests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "period" text NOT NULL,
  "period_start" timestamp with time zone NOT NULL,
  "period_end" timestamp with time zone NOT NULL,
  "content" text NOT NULL,
  "summary_count" integer DEFAULT 0 NOT NULL,
  "top_themes" jsonb DEFAULT '[]' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "digests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "digests_user_id_idx"
ON "digests" USING btree ("user_id");

CREATE INDEX IF NOT EXISTS "digests_period_idx"
ON "digests" USING btree ("user_id", "period", "period_start");
