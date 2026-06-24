import { NextRequest, NextResponse } from "next/server";
import { searchBlogs } from "@/lib/blogs";

export const dynamic = "force-dynamic";

// Public: semantic blog search (same logic as the search_blogs MCP tool).
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ error: "query param `q` is required" }, { status: 400 });
  }
  try {
    const results = await searchBlogs(q);
    return NextResponse.json({ query: q, count: results.length, results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
