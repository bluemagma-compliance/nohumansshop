import { NextRequest, NextResponse } from "next/server";
import { upsertOwner, getOrCreateAgentForOwner } from "@/lib/accounts";

export const dynamic = "force-dynamic";

// DEV-ONLY verification surface for Milestone A. Simulates the post-OAuth step
// with a mocked identity: GET ?owner=<subject>&client_id=<dcr client id>.
// Refuses to run in production. Remove/replace when the real MCP OAuth lands.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const requiredToken = process.env.DEV_SEED_TOKEN;
  if (requiredToken && searchParams.get("token") !== requiredToken) {
    return NextResponse.json({ error: "bad or missing dev token" }, { status: 401 });
  }

  const owner = searchParams.get("owner");
  const clientId = searchParams.get("client_id");
  if (!owner || !clientId) {
    return NextResponse.json(
      { error: "owner and client_id query params are required" },
      { status: 400 },
    );
  }

  try {
    const ownerRow = await upsertOwner(owner, searchParams.get("ref") ?? undefined);
    // client_id is metadata now (one agent per user); same owner -> same agent.
    const agentRow = await getOrCreateAgentForOwner(owner, {
      clientId,
      runtimeHint: searchParams.get("runtime") ?? undefined,
    });
    return NextResponse.json({ owner: ownerRow, agent: agentRow });
  } catch (err) {
    console.error("[dev/connect] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}
