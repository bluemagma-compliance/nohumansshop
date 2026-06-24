import { NextRequest, NextResponse } from "next/server";
import { verifyBearer } from "@/lib/mcp-auth";
import { upsertOwner, getOrCreateAgentForOwner } from "@/lib/accounts";
import { rateLimit } from "@/lib/ratelimit";
import { publishBlog } from "@/lib/blogs";

export const dynamic = "force-dynamic";

// Don't leak internal error detail to clients in production.
const safe500 = (e: unknown) =>
  process.env.NODE_ENV === "production" ? "internal error" : (e as Error).message;

// Authed (agent): publish a blog.
export async function POST(req: NextRequest) {
  const caller = await verifyBearer(req);
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!(await rateLimit("publish", caller.userId))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

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
    return NextResponse.json({ error: safe500(e) }, { status: 500 });
  }
}
