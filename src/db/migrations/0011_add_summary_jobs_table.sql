CREATE TABLE IF NOT EXISTS "summary_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "summary_id" uuid,
  "raindrop_id" bigint NOT NULL,
  "tone" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "error" text,
  "run_count" integer DEFAULT 1 NOT NULL,
  "last_run_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "summary_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "summary_jobs_summary_id_summaries_id_fk" FOREIGN KEY ("summary_id") REFERENCES "summaries"("id") ON DELETE set null ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "unique_summary_jobs_user_raindrop_tone"
ON "summary_jobs" USING btree ("user_id", "raindrop_id", "tone");

CREATE INDEX IF NOT EXISTS "idx_summary_jobs_user_status"
ON "summary_jobs" USING btree ("user_id", "status");

CREATE INDEX IF NOT EXISTS "idx_summary_jobs_user_updated"
ON "summary_jobs" USING btree ("user_id", "updated_at");
