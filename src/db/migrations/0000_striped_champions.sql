CREATE TABLE "api_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"summary_id" uuid,
	"api_provider" text NOT NULL,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"cost_usd" numeric(10, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raindrops" (
	"id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"excerpt" text,
	"cover" text,
	"collection_id" bigint,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at_remote" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "raindrops_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"raindrop_id" bigint NOT NULL,
	"tone" text NOT NULL,
	"summary" text NOT NULL,
	"rating" integer,
	"rating_reason" text,
	"facts_json" jsonb,
	"model" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"raindrop_access_token" text,
	"raindrop_refresh_token" text,
	"raindrop_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_summary_id_summaries_id_fk" FOREIGN KEY ("summary_id") REFERENCES "public"."summaries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raindrops" ADD CONSTRAINT "raindrops_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_usage_user" ON "api_usage" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_raindrops_user_id" ON "raindrops" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_raindrops_synced_at" ON "raindrops" USING btree ("user_id","synced_at");--> statement-breakpoint
CREATE INDEX "idx_raindrops_collection" ON "raindrops" USING btree ("user_id","collection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_raindrop_tone" ON "summaries" USING btree ("user_id","raindrop_id","tone");--> statement-breakpoint
CREATE INDEX "idx_summaries_user_raindrop" ON "summaries" USING btree ("user_id","raindrop_id");--> statement-breakpoint
CREATE INDEX "idx_summaries_status" ON "summaries" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_summaries_created" ON "summaries" USING btree ("user_id","created_at");