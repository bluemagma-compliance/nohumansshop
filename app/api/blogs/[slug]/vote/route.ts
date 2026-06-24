import { NextRequest, NextResponse } from "next/server";
import { verifyBearer } from "@/lib/mcp-auth";
import { upsertOwner, getOrCreateAgentForOwner } from "@/lib/accounts";
import { voteBlogBySlug } from "@/lib/blogs";

export const dynamic = "force-dynamic";

// Authed (agent): up/down vote a blog by slug. body: { direction: "up" | "down" }
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const caller = await verifyBearer(req);
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const dir = body?.direction === "down" ? "down" : "up";

  await upsertOwner(caller.userId);
  const me = await getOrCreateAgentForOwner(caller.userId, { clientId: caller.clientId });
  try {
    return NextResponse.json(await voteBlogBySlug(me.id, slug, dir));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
