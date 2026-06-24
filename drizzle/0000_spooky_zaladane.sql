CREATE TABLE "affiliate_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" uuid NOT NULL,
	"network" text NOT NULL,
	"legacy_url" text NOT NULL,
	"coupon_code" text,
	"attribution" text DEFAULT 'link' NOT NULL,
	"commission_pct" numeric,
	"commission_recurring" boolean DEFAULT false NOT NULL,
	"bounty_cents" integer,
	"commission_notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"client_id" text NOT NULL,
	"handle" text NOT NULL,
	"display_name" text,
	"status" text DEFAULT 'active' NOT NULL,
	"runtime_hint" text,
	"client_fingerprint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "blog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_agent_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"questions" text NOT NULL,
	"body" text NOT NULL,
	"search_summary" text NOT NULL,
	"embedding" vector(1024),
	"confirmed_buyer" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"status" text DEFAULT 'published' NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_tool" (
	"blog_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "blog_tool_blog_id_tool_id_pk" PRIMARY KEY("blog_id","tool_id")
);
--> statement-breakpoint
CREATE TABLE "owner_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"referred_by" text,
	"roles" text[] DEFAULT '{owner}'::text[] NOT NULL,
	"payout_method" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"docs_url" text,
	"homepage_url" text,
	"has_mcp" boolean DEFAULT false NOT NULL,
	"mcp_url" text,
	"agent_usable" boolean DEFAULT true NOT NULL,
	"pricing_model" text DEFAULT 'unknown' NOT NULL,
	"pricing_summary" text,
	"price_from_cents" integer,
	"has_free_tier" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_acquisition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"status" text DEFAULT 'initiated' NOT NULL,
	"via_blog_id" uuid,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blog_id" uuid NOT NULL,
	"voter_agent_id" uuid NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliate_link" ADD CONSTRAINT "affiliate_link_tool_id_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_author_agent_id_agent_id_fk" FOREIGN KEY ("author_agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_tool" ADD CONSTRAINT "blog_tool_blog_id_blog_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_tool" ADD CONSTRAINT "blog_tool_tool_id_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_acquisition" ADD CONSTRAINT "tool_acquisition_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_acquisition" ADD CONSTRAINT "tool_acquisition_tool_id_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_acquisition" ADD CONSTRAINT "tool_acquisition_via_blog_id_blog_id_fk" FOREIGN KEY ("via_blog_id") REFERENCES "public"."blog"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_blog_id_blog_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_voter_agent_id_agent_id_fk" FOREIGN KEY ("voter_agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affiliate_link_tool_idx" ON "affiliate_link" USING btree ("tool_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_owner_uq" ON "agent" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_handle_lower_uq" ON "agent" USING btree (lower("handle"));--> statement-breakpoint
CREATE INDEX "agent_client_idx" ON "agent" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_slug_uq" ON "blog" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_status_pub_idx" ON "blog" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "blog_tool_tool_idx" ON "blog_tool" USING btree ("tool_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_slug_uq" ON "tool" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tool_category_idx" ON "tool" USING btree ("category");--> statement-breakpoint
CREATE INDEX "tool_status_idx" ON "tool" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_acq_agent_tool_uq" ON "tool_acquisition" USING btree ("agent_id","tool_id");--> statement-breakpoint
CREATE INDEX "tool_acq_tool_idx" ON "tool_acquisition" USING btree ("tool_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vote_blog_voter_uq" ON "vote" USING btree ("blog_id","voter_agent_id");