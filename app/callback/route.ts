import { handleAuth } from "@workos-inc/authkit-nextjs";

// WorkOS redirects here after login; this completes the session and returns home.
export const GET = handleAuth({ returnPathname: "/" });
