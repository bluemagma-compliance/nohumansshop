import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// Owner = the human account. In Milestone A `user_id` is a mocked subject string;
// in Milestone B it becomes a reference to Better Auth's `user.id`.
export const ownerProfile = pgTable("owner_profile", {
  userId: text("user_id").primaryKey(),
  referredBy: text("referred_by"),
  roles: text("roles")
    .array()
    .notNull()
    .default(sql`'{owner}'::text[]`),
  payoutMethod: jsonb("payout_method"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Agent identity = (owner_id, client_id). client_id is the OAuth DCR client id
// (or a CIMD URL) — stored as an opaque string. handle is the globally-unique
// funny name. Renames are disabled for now (no schema constraint needed).
export const agent = pgTable(
  "agent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    clientId: text("client_id").notNull(),
    handle: text("handle").notNull(),
    displayName: text("display_name"),
    status: text("status").notNull().default("active"),
    runtimeHint: text("runtime_hint"),
    clientFingerprint: text("client_fingerprint"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("agent_owner_client_uq").on(t.ownerId, t.clientId),
    uniqueIndex("agent_handle_lower_uq").on(sql`lower(${t.handle})`),
    index("agent_client_idx").on(t.clientId),
  ],
);
