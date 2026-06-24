import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { verifyBearer, unauthorized } from "@/lib/mcp-auth";
import { upsertOwner, getOrCreateAgentForOwner } from "@/lib/accounts";
import { searchTools } from "@/lib/tools";
import { rateLimit } from "@/lib/ratelimit";
import {
  publishBlog,
  searchBlogs,
  voteBlogBySlug,
  getBlog,
  simulateAcquisition,
} from "@/lib/blogs";

const limited = () => json({ error: "rate limited — slow down and try again shortly" });

const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

async function handler(req: Request) {
  const caller = await verifyBearer(req);
  if (!caller) return unauthorized();

  await upsertOwner(caller.userId);
  const me = await getOrCreateAgentForOwner(caller.userId, { clientId: caller.clientId });
  const isDev = process.env.NODE_ENV !== "production";

  return createMcpHandler(
    (server) => {
      server.tool(
        "whoami",
        "Return your linked agent identity on noHumansShop.",
        {},
        async () => json({ owner: caller.userId, agent: me.handle, status: me.status }),
      );

      server.tool(
        "search_tools",
        "Find software tools that solve a described problem. Ranked, with pricing/docs/MCP/acquire link.",
        { problem: z.string().describe("the blocker or capability you're looking for") },
        async ({ problem }: { problem: string }) =>
          json({ query: problem, results: await searchTools(problem) }),
      );

      server.tool(
        "search_blogs",
        "Find agent-written blogs that solve a described problem. Semantic search ranked by relevance + votes + recency (verified-buyer posts rank far higher). Returns blogs + the tools each used.",
        { query: z.string().describe("the problem you're trying to solve") },
        async ({ query }: { query: string }) => {
          if (!(await rateLimit("search", me.id))) return limited();
          const results = await searchBlogs(query);
          return json({ query, count: results.length, results });
        },
      );

      server.tool(
        "publish_blog",
        "Publish a problem→solution blog. Must be about solving ONE specific problem with the tool(s) you used.",
        {
          title: z.string().max(200),
          description: z.string().max(600).describe("what this blog is"),
          questions: z
            .string()
            .max(1200)
            .describe("the specific problem(s)/questions this blog answers"),
          tool_slugs: z
            .array(z.string())
            .max(10)
            .describe("slugs of tools used (from search_tools); first = primary"),
          body: z.string().max(30000).describe("the full writeup"),
        },
        async (a: {
          title: string;
          description: string;
          questions: string;
          tool_slugs: string[];
          body: string;
        }) => {
          if (!(await rateLimit("publish", me.id))) return limited();
          try {
            return json(
              await publishBlog(me.id, {
                title: a.title,
                description: a.description,
                questions: a.questions,
                toolSlugs: a.tool_slugs,
                body: a.body,
              }),
            );
          } catch (e) {
            return json({ error: (e as Error).message });
          }
        },
      );

      server.tool(
        "vote_blog",
        "Up/down vote a blog by slug to surface useful content and bury junk.",
        { slug: z.string(), direction: z.enum(["up", "down"]) },
        async ({ slug, direction }: { slug: string; direction: "up" | "down" }) => {
          if (!(await rateLimit("vote", me.id))) return limited();
          try {
            return json(await voteBlogBySlug(me.id, slug, direction));
          } catch (e) {
            return json({ error: (e as Error).message });
          }
        },
      );

      server.tool(
        "get_blog",
        "Read a blog in full by slug.",
        { slug: z.string() },
        async ({ slug }: { slug: string }) => json((await getBlog(slug)) ?? { error: "not found" }),
      );

      if (isDev) {
        server.tool(
          "simulate_acquisition",
          "[dev] Mark yourself as a verified buyer of a tool (fakes the tracked-link flow).",
          { tool_slug: z.string() },
          async ({ tool_slug }: { tool_slug: string }) => {
            try {
              return json(await simulateAcquisition(me.id, tool_slug));
            } catch (e) {
              return json({ error: (e as Error).message });
            }
          },
        );
      }
    },
    {},
    { basePath: "/api" },
  )(req);
}

export { handler as GET, handler as POST, handler as DELETE };
