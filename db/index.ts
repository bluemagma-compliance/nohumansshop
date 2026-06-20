import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as domain from "./schema";
import * as authSchema from "./auth-schema";

// neon-http connects lazily (per query), so constructing with a placeholder when
// DATABASE_URL is unset keeps `next build` + codegen working; real queries need a real URL.
const url =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost/placeholder";

const schema = { ...domain, ...authSchema };

export const db = drizzle(neon(url), { schema });

// Back-compat for lib/accounts.ts (Milestone A used getDb()).
export function getDb() {
  return db;
}

export { schema, authSchema };
