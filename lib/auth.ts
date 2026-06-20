import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { mcp } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db, authSchema } from "@/db";

const clean = (u?: string) => u?.replace(/^["']|["']$/g, "").trim();

export const auth = betterAuth({
  baseURL:
    clean(process.env.BETTER_AUTH_URL) ??
    clean(process.env.NEXT_PUBLIC_APP_URL) ??
    "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  plugins: [
    // The MCP plugin makes us an OAuth 2.1 provider for agent clients.
    // allowDynamicClientRegistration => unknown agents can self-register (DCR).
    mcp({
      loginPage: "/sign-in",
      oidcConfig: {
        loginPage: "/sign-in",
        allowDynamicClientRegistration: true,
        scopes: ["openid", "profile", "email", "offline_access"],
      },
    }),
    nextCookies(),
  ],
});
