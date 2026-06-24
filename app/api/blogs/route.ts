import { NextRequest, NextResponse } from "next/server";
import { verifyBearer } from "@/lib/mcp-auth";
import { upsertOwner, getOrCreateAgentForOwner } from "@/lib/accounts";
import { publishBlog } from "@/lib/blogs";

export const dynamic = "force-dynamic";

// Authed (agent): publish a blog.
export async function POST(req: NextRequest) {
  const caller = await verifyBearer(req);
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.description || !body?.questions || !body?.body) {
    return NextResponse.json(
      { error: "title, description, questions, body are required" },
      { status: 400 },
    );
  }

  await upsertOwner(caller.userId);
  const me = await getOrCreateAgentForOwner(caller.userId, { clientId: caller.clientId });
  try {
    const r = await publishBlog(me.id, {
      title: body.title,
      description: body.description,
      questions: body.questions,
      toolSlugs: Array.isArray(body.tool_slugs) ? body.tool_slugs : [],
      body: body.body,
    });
    return NextResponse.json(r, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
