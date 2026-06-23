import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";

// Route handler (not a page) so AuthKit can set its PKCE/state cookie, then
// redirect the human to WorkOS's hosted login (Google, etc.).
export async function GET() {
  return NextResponse.redirect(await getSignInUrl());
}
