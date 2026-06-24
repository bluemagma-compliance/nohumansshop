import { createMcpHandler } from "mcp-handler";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { z } from "zod";
import { upsertOwner, getOrCreateAgentForOwner } from "@/lib/accounts";
import { searchTools } from "@/lib/tools";

// --- token verification (WorkOS AuthKit is the authorization server; we're the resource server) ---
// MCP tokens are issued by the AuthKit /oauth2 AS, signed by its own JWKS, with
// issuer = the AuthKit domain. (Lazy so `next build` works without the env set.)
const AUTHKIT = (process.env.WORKOS_AUTHKIT_DOMAIN ?? "").replace(/\/$/, "");
// WorkOS stamps the access-token `aud` with the OAuth client_id (not the resource URL),
// so we bind to that. (issuer + signature still prove it's from our AuthKit.)
const CLIENT_ID = process.env.WORKOS_CLIENT_ID ?? "";
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!_jwks) _jwks = createRemoteJWKSet(new URL(`${AUTHKIT}/oauth2/jwks`));
  return _jwks;
}

const APP = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const RESOURCE = process.env.WORKOS_MCP_RESOURCE ?? `${APP}/api/mcp`;
const PRM = `${APP}/.well-known/oauth-protected-resource`;

function unauthorized() {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null }),
    {
      status: 401,
      headers: {
        // Triggers the client's OAuth/login-link flow per RFC 9728.
        "WWW-Authenticate": `Bearer resource_metadata="${PRM}"`,
        "content-type": "application/json",
      },
    },
  );
}

async function verify(req: Request): Promise<JWTPayload | null> {
  const m = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    // JWKS + issuer prove it's AuthKit-issued; audience binds it to THIS MCP server (RFC 8707).
    const { payload } = await jwtVerify(m[1], getJwks(), {
      issuer: AUTHKIT,
      audience: CLIENT_ID,
    });
    return payload;
  } catch (e) {
    console.error("[mcp] token rejected:", (e as Error).message);
    return null;
  }
}

async function handler(req: Request) {
  const claims = await verify(req);
  if (!claims?.sub) return unauthorized();

  const userId = String(claims.sub);
  const c = claims as Record<string, unknown>;
  const clientId = String(c.client_id ?? c.azp ?? "workos");

  return createMcpHandler(
    (server) => {
      server.tool(
        "whoami",
        "Return your linked agent identity on noHumansShop.",
        {},
        async () => {
          await upsertOwner(userId);
          const agent = await getOrCreateAgentForOwner(userId, { clientId });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  owner: userId,
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
        "Find software tools that solve a described problem. Returns ranked matches with pricing, docs, MCP availability, and how to get each.",
        { problem: z.string().describe("the blocker or capability you're looking for") },
        async ({ problem }: { problem: string }) => {
          const results = await searchTools(problem);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { query: problem, count: results.length, results },
                  null,
                  2,
                ),
              },
            ],
          };
        },
      );
    },
    {},
    { basePath: "/api" },
  )(req);
}

export { handler as GET, handler as POST, handler as DELETE };
