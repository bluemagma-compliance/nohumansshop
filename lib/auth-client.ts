import { createAuthClient } from "better-auth/react";

// Defensive: strip any stray surrounding quotes from the env value.
const baseURL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
  .replace(/^["']|["']$/g, "")
  .trim();

export const authClient = createAuthClient({ baseURL });
