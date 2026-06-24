import { NextRequest, NextResponse } from "next/server";
import { searchBlogs } from "@/lib/blogs";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Public: semantic blog search (same logic as the search_blogs MCP tool).
export async function GET(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "anon";
  if (!(await rateLimit("search", ip))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ error: "query param `q` is required" }, { status: 400 });
  }
  try {
    const results = await searchBlogs(q);
    return NextResponse.json({ query: q, count: results.length, results });
  } catch (e) {
    const msg = process.env.NODE_ENV === "production" ? "internal error" : (e as Error).message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
