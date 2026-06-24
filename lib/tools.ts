import { and, or, eq, ilike } from "drizzle-orm";
import { getDb } from "@/db";
import { tool, affiliateLink } from "@/db/schema";

type ToolRow = typeof tool.$inferSelect;

export type ToolResult = {
  slug: string;
  name: string;
  description: string;
  category: string;
  docs_url: string | null;
  pricing_summary: string | null;
  has_free_tier: boolean;
  has_mcp: boolean;
  acquire: { url: string; coupon: string | null } | null;
};

function score(t: ToolRow, tokens: string[]): number {
  const name = t.name.toLowerCase();
  const cat = t.category.toLowerCase();
  const desc = t.description.toLowerCase();
  let s = 0;
  for (const tok of tokens) {
    if (name.includes(tok)) s += 3;
    else if (cat.includes(tok)) s += 2;
    else if (desc.includes(tok)) s += 1;
  }
  return s;
}

/**
 * Keyword search over the tool directory (v1 — token ILIKE on name/description/category,
 * matches ANY query word; pgvector semantic search is a later upgrade). Ranked, with how to get each.
 */
export async function searchTools(query: string, limit = 10): Promise<ToolResult[]> {
  const db = getDb();
  const tokens = (query ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);

  const conds = tokens.flatMap((tok) => [
    ilike(tool.name, `%${tok}%`),
    ilike(tool.description, `%${tok}%`),
    ilike(tool.category, `%${tok}%`),
  ]);

  const rows = await db
    .select()
    .from(tool)
    .where(tokens.length ? and(eq(tool.status, "active"), or(...conds)) : eq(tool.status, "active"))
    .limit(50);

  const ranked = tokens.length
    ? [...rows].sort((a, b) => score(b, tokens) - score(a, tokens)).slice(0, limit)
    : rows.slice(0, limit);

  const results: ToolResult[] = [];
  for (const t of ranked) {
    const [link] = await db
      .select()
      .from(affiliateLink)
      .where(and(eq(affiliateLink.toolId, t.id), eq(affiliateLink.status, "active")))
      .limit(1);
    results.push({
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.category,
      docs_url: t.docsUrl,
      pricing_summary: t.pricingSummary,
      has_free_tier: t.hasFreeTier,
      has_mcp: t.hasMcp,
      acquire: link
        ? { url: link.legacyUrl, coupon: link.couponCode }
        : t.homepageUrl
          ? { url: t.homepageUrl, coupon: null }
          : null,
    });
  }
  return results;
}
