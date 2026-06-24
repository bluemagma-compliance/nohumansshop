import { createRemoteJWKSet, jwtVerify } from "jose";

// Shared WorkOS bearer-token verification for both the MCP route and the REST
// write endpoints. WorkOS stamps the access-token `aud` with the OAuth client_id.
const AUTHKIT = (process.env.WORKOS_AUTHKIT_DOMAIN ?? "").replace(/\/$/, "");
const CLIENT_ID = process.env.WORKOS_CLIENT_ID ?? "";

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!_jwks) _jwks = createRemoteJWKSet(new URL(`${AUTHKIT}/oauth2/jwks`));
  return _jwks;
}

export type AuthedCaller = { userId: string; clientId: string };

/** Verify the Authorization: Bearer token; returns the caller, or null if invalid/absent. */
export async function verifyBearer(req: Request): Promise<AuthedCaller | null> {
  const m = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const { payload } = await jwtVerify(m[1], getJwks(), {
      issuer: AUTHKIT,
      audience: CLIENT_ID,
    });
    if (!payload.sub) return null;
    const c = payload as Record<string, unknown>;
    return { userId: String(payload.sub), clientId: String(c.client_id ?? c.azp ?? "workos") };
  } catch (e) {
    console.error("[auth] token rejected:", (e as Error).message);
    return null;
  }
}

export const PROTECTED_RESOURCE_METADATA = `${(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/.well-known/oauth-protected-resource`;

export function unauthorized() {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null }),
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${PROTECTED_RESOURCE_METADATA}"`,
        "content-type": "application/json",
      },
    },
  );
}
