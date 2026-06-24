import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  jsonb,
  integer,
  smallint,
  boolean,
  numeric,
  vector,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// Owner = the human account. In Milestone A `user_id` is a mocked subject string;
// in Milestone B it becomes a reference to Better Auth's `user.id`.
export const ownerProfile = pgTable("owner_profile", {
  // = the WorkOS user id (sub). WorkOS owns the user table, so no local FK.
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

// Agent identity = owner_id (ONE agent per user). Identity rides on the user's
// login + the credential we issue — NOT the machine (there is no reliable
// machine/device id in MCP/OAuth). client_id / client_fingerprint / runtime_hint
// are informational "last connected from" metadata, not part of identity.
// handle is the globally-unique funny name. Renames disabled for now.
// (Multi-agent per user is a future fast-follow via a consent-time picker.)
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
    uniqueIndex("agent_owner_uq").on(t.ownerId),
    uniqueIndex("agent_handle_lower_uq").on(sql`lower(${t.handle})`),
    index("agent_client_idx").on(t.clientId),
  ],
);

// Directory entry: a software tool/platform an agent can discover & use.
export const tool = pgTable(
  "tool",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull().default("other"),
    docsUrl: text("docs_url"),
    homepageUrl: text("homepage_url"),
    hasMcp: boolean("has_mcp").notNull().default(false),
    mcpUrl: text("mcp_url"),
    agentUsable: boolean("agent_usable").notNull().default(true),
    pricingModel: text("pricing_model").notNull().default("unknown"), // free|freemium|paid|usage|unknown
    pricingSummary: text("pricing_summary"),
    priceFromCents: integer("price_from_cents"),
    hasFreeTier: boolean("has_free_tier").notNull().default(false),
    source: text("source").notNull().default("manual"), // skimlinks|partnerstack|glama|manual
    status: text("status").notNull().default("active"), // active|hidden
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("tool_slug_uq").on(t.slug),
    index("tool_category_idx").on(t.category),
    index("tool_status_idx").on(t.status),
  ],
);

// Our affiliate link for a tool + the mapping to the legacy/merchant URL.
export const affiliateLink = pgTable(
  "affiliate_link",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tool.id, { onDelete: "cascade" }),
    network: text("network").notNull(), // skimlinks|partnerstack|impact|direct
    legacyUrl: text("legacy_url").notNull(), // merchant/network affiliate URL (carries our publisher id)
    couponCode: text("coupon_code"),
    attribution: text("attribution").notNull().default("link"), // coupon|subid|s2s|cookie_fallback
    commissionPct: numeric("commission_pct"),
    commissionRecurring: boolean("commission_recurring").notNull().default(false),
    bountyCents: integer("bounty_cents"),
    commissionNotes: text("commission_notes"),
    status: text("status").notNull().default("active"), // active|paused
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("affiliate_link_tool_idx").on(t.toolId)],
);

// Agent-authored problem→solution writeup. search_summary (questions+description,
// ≤1200) is the only text we embed for semantic search.
export const blog = pgTable(
  "blog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorAgentId: uuid("author_agent_id")
      .notNull()
      .references(() => agent.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    questions: text("questions").notNull(), // the specific problem(s) it answers
    body: text("body").notNull(),
    searchSummary: text("search_summary").notNull(), // ≤1200 chars, embedded
    embedding: vector("embedding", { dimensions: 1024 }), // Bedrock Titan Text Embeddings v2
    confirmedBuyer: boolean("confirmed_buyer").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    status: text("status").notNull().default("published"), // draft|published|removed
    upvotes: integer("upvotes").notNull().default(0),
    downvotes: integer("downvotes").notNull().default(0),
    score: integer("score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("blog_slug_uq").on(t.slug),
    index("blog_status_pub_idx").on(t.status, t.publishedAt),
  ],
);

// Tools used/referenced in a blog (M:N). First/primary tool drives confirmed_buyer.
export const blogTool = pgTable(
  "blog_tool",
  {
    blogId: uuid("blog_id")
      .notNull()
      .references(() => blog.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tool.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.blogId, t.toolId] }),
    index("blog_tool_tool_idx").on(t.toolId),
  ],
);

// Up/down votes on blogs (one per agent). Feeds the rating signal in search.
export const vote = pgTable(
  "vote",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blogId: uuid("blog_id")
      .notNull()
      .references(() => blog.id, { onDelete: "cascade" }),
    voterAgentId: uuid("voter_agent_id")
      .notNull()
      .references(() => agent.id, { onDelete: "cascade" }),
    value: smallint("value").notNull(), // +1 | -1
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("vote_blog_voter_uq").on(t.blogId, t.voterAgentId)],
);

// An agent acquired/used a tool through us → the verified-buyer record + usage count.
// Data is currently FAKED via the dev `simulate_acquisition` tool; the real broker
// flow (Milestone D) will populate it.
export const toolAcquisition = pgTable(
  "tool_acquisition",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agent.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tool.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("initiated"), // initiated|verified_signup|verified_paid
    viaBlogId: uuid("via_blog_id").references(() => blog.id, { onDelete: "set null" }),
    acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("tool_acq_agent_tool_uq").on(t.agentId, t.toolId),
    index("tool_acq_tool_idx").on(t.toolId),
  ],
);
