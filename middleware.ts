import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

// Manages the human session on page loads. Intentionally does NOT run on the MCP
// endpoint or discovery routes — those are bearer-token / public, not cookie-auth.
export default authkitMiddleware();

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|\\.well-known/|llms.txt).*)",
  ],
};
