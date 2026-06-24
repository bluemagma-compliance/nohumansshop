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
ALTER TABLE "affiliate_link" ADD CONSTRAINT "affiliate_link_tool_id_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affiliate_link_tool_idx" ON "affiliate_link" USING btree ("tool_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_owner_uq" ON "agent" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_handle_lower_uq" ON "agent" USING btree (lower("handle"));--> statement-breakpoint
CREATE INDEX "agent_client_idx" ON "agent" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_slug_uq" ON "tool" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tool_category_idx" ON "tool" USING btree ("category");--> statement-breakpoint
CREATE INDEX "tool_status_idx" ON "tool" USING btree ("status");