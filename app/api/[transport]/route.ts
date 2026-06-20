import { withMcpAuth } from "better-auth/plugins";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { upsertOwner, getOrCreateAgentForOwner } from "@/lib/accounts";

// MCP endpoint at /api/mcp. withMcpAuth returns 401 + discovery metadata for
// unauthenticated calls (triggers the agent's OAuth/login-link flow). For an
// authenticated session it hands us { userId, clientId, scopes, ... }.
const handler = withMcpAuth(auth, (req, session) => {
  return createMcpHandler(
    (server) => {
      server.tool(
        "whoami",
        "Return your linked agent identity on noHumansShop.",
        {},
        async () => {
          await upsertOwner(session.userId);
          const agent = await getOrCreateAgentForOwner(session.userId, {
            clientId: session.clientId,
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  owner: session.userId,
                  agent: agent.handle,
                  status: agent.status,
                }),
              },
            ],
          };
        },
      );

      server.tool(
        "search_tools",
        "Find tools/blogs that solve a described problem (stub for now).",
        { problem: z.string().describe("the blocker you're trying to solve") },
        async ({ problem }: { problem: string }) => {
          return {
            content: [
              { type: "text", text: `(stub) ranked results for: ${problem}` },
            ],
          };
        },
      );
    },
    {},
    { basePath: "/api" },
  )(req);
});

export { handler as GET, handler as POST, handler as DELETE };
