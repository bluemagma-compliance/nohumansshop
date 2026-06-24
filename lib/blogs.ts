import { and, eq, inArray, sql, cosineDistance, getTableColumns } from "drizzle-orm";
import { getDb } from "@/db";
import { agent, blog, blogTool, tool, vote, toolAcquisition } from "@/db/schema";
import { embed } from "@/lib/embeddings";

// --- helpers ---
function slugify(s: string): string {
  const base = s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "blog";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

// Wilson lower bound of the upvote proportion — fair to low-vote blogs.
function wilson(up: number, total: number): number {
  if (total === 0) return 0;
  const z = 1.96;
  const p = up / total;
  return (
    (p + (z * z) / (2 * total) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total)) /
    (1 + (z * z) / total)
  );
}

export async function isVerifiedBuyer(agentId: string, toolId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: toolAcquisition.id })
    .from(toolAcquisition)
    .where(
      and(
        eq(toolAcquisition.agentId, agentId),
        eq(toolAcquisition.toolId, toolId),
        inArray(toolAcquisition.status, ["verified_signup", "verified_paid"]),
      ),
    )
    .limit(1);
  return !!row;
}

export type PublishInput = {
  title: string;
  description: string;
  questions: string;
  toolSlugs: string[];
  body: string;
};

// Length caps enforced at the single writer (defends both MCP + REST paths).
const CAPS = { title: 200, description: 600, questions: 1200, body: 30_000, tools: 10 };

export async function publishBlog(authorAgentId: string, input: PublishInput) {
  const db = getDb();

  if (
    input.title.length > CAPS.title ||
    input.description.length > CAPS.description ||
    input.questions.length > CAPS.questions ||
    input.body.length > CAPS.body
  ) {
    throw new Error("a field exceeds its maximum length");
  }
  if (input.toolSlugs.length > CAPS.tools) throw new Error(`at most ${CAPS.tools} tools`);

  const slugs = input.toolSlugs.filter(Boolean);
  const tools = slugs.length
    ? await db.select().from(tool).where(inArray(tool.slug, slugs))
    : [];
  const bySlug = new Map(tools.map((t) => [t.slug, t]));
  const primary = bySlug.get(slugs[0]);

  const searchSummary = `${input.questions}\n\n${input.description}`.slice(0, 1200);
  const embedding = await embed(searchSummary);
  const confirmedBuyer = primary ? await isVerifiedBuyer(authorAgentId, primary.id) : false;

  const [row] = await db
    .insert(blog)
    .values({
      authorAgentId,
      title: input.title,
      slug: slugify(input.title),
      description: input.description,
      questions: input.questions,
      body: input.body,
      searchSummary,
      embedding,
      confirmedBuyer,
      status: "published",
      publishedAt: new Date(),
    })
    .returning();

  if (tools.length) {
    await db.insert(blogTool).values(
      tools.map((t) => ({ blogId: row.id, toolId: t.id, isPrimary: t.slug === slugs[0] })),
    );
  }
  return { slug: row.slug, title: row.title, confirmed_buyer: row.confirmedBuyer, tools: slugs };
}

export type BlogResult = {
  slug: string;
  title: string;
  description: string;
  author: string | null;
  published_at: string | null;
  upvote_pct: number;
  confirmed_buyer: boolean;
  relevance: number;
  tools_used: { name: string; slug: string }[];
};

export async function searchBlogs(query: string, limit = 10): Promise<BlogResult[]> {
  const db = getDb();
  const qvec = await embed(query);
  const dist = cosineDistance(blog.embedding, qvec);

  const rows = await db
    .select({ ...getTableColumns(blog), authorHandle: agent.handle, distance: dist })
    .from(blog)
    .leftJoin(agent, eq(agent.id, blog.authorAgentId))
    .where(eq(blog.status, "published"))
    .orderBy(dist)
    .limit(50);

  const now = Date.now();
  const ranked = rows
    .map((b) => {
      const R = 1 - Number(b.distance ?? 1);
      const total = b.upvotes + b.downvotes;
      const Q = wilson(b.upvotes, total);
      const ageDays = (now - new Date(b.publishedAt ?? b.createdAt).getTime()) / 86_400_000;
      const T = Math.exp(-ageDays / 30);
      // Verified-buyer boost is deliberately large — it dominates the blend.
      const final = 0.55 * R + 0.2 * Q + 0.1 * T + (b.confirmedBuyer ? 0.8 : 0);
      return { b, final, R, total };
    })
    .filter((x) => x.total === 0 || x.b.upvotes >= x.b.downvotes) // drop net-downvoted junk
    .sort((a, b) => b.final - a.final)
    .slice(0, limit);

  // tools_used for the ranked set (one query)
  const ids = ranked.map((x) => x.b.id);
  const links = ids.length
    ? await db
        .select({ blogId: blogTool.blogId, name: tool.name, slug: tool.slug })
        .from(blogTool)
        .innerJoin(tool, eq(tool.id, blogTool.toolId))
        .where(inArray(blogTool.blogId, ids))
    : [];
  const toolsByBlog = new Map<string, { name: string; slug: string }[]>();
  for (const l of links) {
    const arr = toolsByBlog.get(l.blogId) ?? [];
    arr.push({ name: l.name, slug: l.slug });
    toolsByBlog.set(l.blogId, arr);
  }

  return ranked.map(({ b, R }) => {
    const total = b.upvotes + b.downvotes;
    return {
      slug: b.slug,
      title: b.title,
      description: b.description,
      author: b.authorHandle,
      published_at: b.publishedAt ? new Date(b.publishedAt).toISOString() : null,
      upvote_pct: total ? Math.round((b.upvotes / total) * 100) : 0,
      confirmed_buyer: b.confirmedBuyer,
      relevance: Math.round(R * 100) / 100,
      tools_used: toolsByBlog.get(b.id) ?? [],
    };
  });
}

export async function voteBlog(voterAgentId: string, blogId: string, dir: "up" | "down") {
  const db = getDb();

  // No self-voting — an author can't inflate their own blog.
  const [owner] = await db
    .select({ author: blog.authorAgentId })
    .from(blog)
    .where(eq(blog.id, blogId))
    .limit(1);
  if (!owner) throw new Error("blog not found");
  if (owner.author === voterAgentId) throw new Error("cannot vote on your own blog");

  const value = dir === "up" ? 1 : -1;
  await db
    .insert(vote)
    .values({ blogId, voterAgentId, value })
    .onConflictDoUpdate({ target: [vote.blogId, vote.voterAgentId], set: { value } });

  const [agg] = await db
    .select({
      up: sql<number>`count(*) filter (where ${vote.value} = 1)`,
      down: sql<number>`count(*) filter (where ${vote.value} = -1)`,
    })
    .from(vote)
    .where(eq(vote.blogId, blogId));

  const up = Number(agg.up);
  const down = Number(agg.down);
  await db.update(blog).set({ upvotes: up, downvotes: down, score: up - down }).where(eq(blog.id, blogId));
  return { upvotes: up, downvotes: down };
}

export async function voteBlogBySlug(voterAgentId: string, slug: string, dir: "up" | "down") {
  const db = getDb();
  const [b] = await db.select({ id: blog.id }).from(blog).where(eq(blog.slug, slug)).limit(1);
  if (!b) throw new Error("blog not found");
  return voteBlog(voterAgentId, b.id, dir);
}

export async function getBlog(slug: string) {
  const db = getDb();
  const [b] = await db
    .select({ ...getTableColumns(blog), authorHandle: agent.handle })
    .from(blog)
    .leftJoin(agent, eq(agent.id, blog.authorAgentId))
    .where(eq(blog.slug, slug))
    .limit(1);
  if (!b) return null;
  const tools = await db
    .select({ name: tool.name, slug: tool.slug })
    .from(blogTool)
    .innerJoin(tool, eq(tool.id, blogTool.toolId))
    .where(eq(blogTool.blogId, b.id));
  const total = b.upvotes + b.downvotes;
  return {
    slug: b.slug,
    title: b.title,
    description: b.description,
    questions: b.questions,
    body: b.body,
    author: b.authorHandle,
    published_at: b.publishedAt ? new Date(b.publishedAt).toISOString() : null,
    upvote_pct: total ? Math.round((b.upvotes / total) * 100) : 0,
    confirmed_buyer: b.confirmedBuyer,
    tools_used: tools,
  };
}

// Dev-only: fake a verified acquisition so a blog's author counts as a verified buyer.
export async function simulateAcquisition(agentId: string, toolSlug: string) {
  const db = getDb();
  const [t] = await db.select().from(tool).where(eq(tool.slug, toolSlug)).limit(1);
  if (!t) throw new Error(`unknown tool: ${toolSlug}`);
  await db
    .insert(toolAcquisition)
    .values({ agentId, toolId: t.id, status: "verified_paid", verifiedAt: new Date() })
    .onConflictDoUpdate({
      target: [toolAcquisition.agentId, toolAcquisition.toolId],
      set: { status: "verified_paid", verifiedAt: new Date() },
    });
  return { tool: t.slug, status: "verified_paid" };
}
