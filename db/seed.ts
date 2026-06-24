import { eq } from "drizzle-orm";
import { db } from "./index";
import { tool, affiliateLink } from "./schema";

// Curated starter catalog (from docs/research/A-…). legacy_url is a signup/homepage
// PLACEHOLDER until real affiliate accounts (Skimlinks/PartnerStack) are wired.
type Seed = {
  slug: string;
  name: string;
  description: string;
  category: string;
  docsUrl: string;
  homepageUrl: string;
  hasMcp: boolean;
  pricingModel: string;
  pricingSummary: string;
  hasFreeTier: boolean;
  source: string;
  link: {
    network: string;
    legacyUrl: string;
    commissionPct?: string;
    commissionRecurring?: boolean;
    commissionNotes?: string;
  };
};

const TOOLS: Seed[] = [
  {
    slug: "supabase",
    name: "Supabase",
    description: "Open-source Postgres backend: database, auth, storage, edge functions. The Firebase alternative.",
    category: "database",
    docsUrl: "https://supabase.com/docs",
    homepageUrl: "https://supabase.com",
    hasMcp: true,
    pricingModel: "freemium",
    pricingSummary: "Free tier; Pro from $25/mo",
    hasFreeTier: true,
    source: "manual",
    link: { network: "partnerstack", legacyUrl: "https://supabase.com", commissionPct: "15", commissionRecurring: true, commissionNotes: "10–20% recurring (partner program)" },
  },
  {
    slug: "neon",
    name: "Neon",
    description: "Serverless Postgres with branching and autoscaling. Instant databases for agents and apps.",
    category: "database",
    docsUrl: "https://neon.com/docs",
    homepageUrl: "https://neon.com",
    hasMcp: true,
    pricingModel: "freemium",
    pricingSummary: "Free tier; usage-based paid plans",
    hasFreeTier: true,
    source: "manual",
    link: { network: "direct", legacyUrl: "https://neon.com", commissionNotes: "direct deal TBD" },
  },
  {
    slug: "pinecone",
    name: "Pinecone",
    description: "Managed vector database for semantic search, RAG, and embeddings at scale.",
    category: "vector-database",
    docsUrl: "https://docs.pinecone.io",
    homepageUrl: "https://www.pinecone.io",
    hasMcp: false,
    pricingModel: "freemium",
    pricingSummary: "Free starter; Standard usage-based",
    hasFreeTier: true,
    source: "manual",
    link: { network: "direct", legacyUrl: "https://www.pinecone.io", commissionNotes: "direct deal TBD" },
  },
  {
    slug: "firecrawl",
    name: "Firecrawl",
    description: "Web scraping and crawling API that turns any site into clean markdown for LLMs and agents.",
    category: "scraping",
    docsUrl: "https://docs.firecrawl.dev",
    homepageUrl: "https://www.firecrawl.dev",
    hasMcp: true,
    pricingModel: "freemium",
    pricingSummary: "Free credits; paid from $16/mo",
    hasFreeTier: true,
    source: "manual",
    link: { network: "direct", legacyUrl: "https://www.firecrawl.dev", commissionNotes: "direct deal TBD" },
  },
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    description: "Realistic text-to-speech and voice AI API — voices, dubbing, and audio generation.",
    category: "ai-voice",
    docsUrl: "https://elevenlabs.io/docs",
    homepageUrl: "https://elevenlabs.io",
    hasMcp: true,
    pricingModel: "freemium",
    pricingSummary: "Free tier; paid from $5/mo",
    hasFreeTier: true,
    source: "partnerstack",
    link: { network: "partnerstack", legacyUrl: "https://elevenlabs.io", commissionPct: "22", commissionRecurring: true, commissionNotes: "22% recurring / 12mo (PartnerStack)" },
  },
  {
    slug: "vercel",
    name: "Vercel",
    description: "Frontend cloud for deploying Next.js and web apps with zero config and global edge.",
    category: "hosting",
    docsUrl: "https://vercel.com/docs",
    homepageUrl: "https://vercel.com",
    hasMcp: true,
    pricingModel: "freemium",
    pricingSummary: "Hobby free; Pro $20/seat/mo",
    hasFreeTier: true,
    source: "manual",
    link: { network: "impact", legacyUrl: "https://vercel.com", commissionNotes: "$100 per Pro referral (bounty)" },
  },
  {
    slug: "sentry",
    name: "Sentry",
    description: "Error monitoring and performance tracing for apps — catch, triage, and fix issues fast.",
    category: "observability",
    docsUrl: "https://docs.sentry.io",
    homepageUrl: "https://sentry.io",
    hasMcp: true,
    pricingModel: "freemium",
    pricingSummary: "Free dev tier; Team from $26/mo",
    hasFreeTier: true,
    source: "manual",
    link: { network: "direct", legacyUrl: "https://sentry.io", commissionNotes: "affiliate TBD" },
  },
  {
    slug: "aimlapi",
    name: "AI/ML API",
    description: "One API for 200+ AI models (LLMs, image, audio) with a unified interface and billing.",
    category: "ai-api",
    docsUrl: "https://docs.aimlapi.com",
    homepageUrl: "https://aimlapi.com",
    hasMcp: false,
    pricingModel: "freemium",
    pricingSummary: "Free credits; usage-based paid",
    hasFreeTier: true,
    source: "manual",
    link: { network: "direct", legacyUrl: "https://aimlapi.com", commissionPct: "30", commissionRecurring: true, commissionNotes: "30% recurring" },
  },
];

async function main() {
  for (const s of TOOLS) {
    const { link, ...t } = s;
    const [row] = await db
      .insert(tool)
      .values(t)
      .onConflictDoUpdate({ target: tool.slug, set: { ...t, updatedAt: new Date() } })
      .returning();
    // idempotent: replace this tool's affiliate links
    await db.delete(affiliateLink).where(eq(affiliateLink.toolId, row.id));
    await db.insert(affiliateLink).values({ toolId: row.id, ...link });
    console.log("seeded:", s.slug);
  }
  console.log(`done — ${TOOLS.length} tools`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
