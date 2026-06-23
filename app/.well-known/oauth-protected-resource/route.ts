export const dynamic = "force-dynamic";

const APP = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

// RFC 9728: tells MCP clients which authorization server (WorkOS AuthKit) protects
// this resource, so they know where to run the login/OAuth flow.
export async function GET() {
  const resource = process.env.WORKOS_MCP_RESOURCE ?? `${APP}/api/mcp`;
  const authServer = process.env.WORKOS_AUTHKIT_DOMAIN;
  return Response.json({
    resource,
    authorization_servers: authServer ? [authServer] : [],
    bearer_methods_supported: ["header"],
  });
}
