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
CREATE UNIQUE INDEX "agent_owner_uq" ON "agent" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_handle_lower_uq" ON "agent" USING btree (lower("handle"));--> statement-breakpoint
CREATE INDEX "agent_client_idx" ON "agent" USING btree ("client_id");