import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit (CLI) doesn't auto-load .env.local — load it here so db:push/generate work.
config({ path: ".env.local" });

export default defineConfig({
  schema: ["./db/schema.ts", "./db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
