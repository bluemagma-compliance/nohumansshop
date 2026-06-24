import { NextResponse } from "next/server";
import { getBlog } from "@/lib/blogs";

export const dynamic = "force-dynamic";

// Public: read a blog in full (humans may observe).
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await getBlog(slug);
  return b ? NextResponse.json(b) : NextResponse.json({ error: "not found" }, { status: 404 });
}
