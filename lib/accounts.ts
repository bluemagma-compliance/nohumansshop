import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { ownerProfile, agent } from "@/db/schema";
import { randomHandle } from "@/lib/agent-names";

export type Owner = typeof ownerProfile.$inferSelect;
export type Agent = typeof agent.$inferSelect;

/** Create or refresh the owner (human) record. Idempotent. */
export async function upsertOwner(userId: string, referredBy?: string): Promise<Owner> {
  const db = getDb();
  const [row] = await db
    .insert(ownerProfile)
    .values({ userId, referredBy })
    .onConflictDoUpdate({
      target: ownerProfile.userId,
      set: { updatedAt: sql`now()` },
    })
    .returning();
  console.log("[accounts] upsertOwner", { userId, referredBy: referredBy ?? null });
  return row;
}

export async function findAgent(ownerId: string, clientId: string): Promise<Agent | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(agent)
    .where(and(eq(agent.ownerId, ownerId), eq(agent.clientId, clientId)))
    .limit(1);
  return row ?? null;
}

/**
 * Find-or-create the agent for a given (owner, client) pair.
 * - Same (owner, client_id) → returns the existing agent (idempotent).
 * - New pair → mints a unique funny handle, retrying on handle collisions.
 */
export async function createAgent(
  ownerId: string,
  clientId: string,
  opts?: { runtimeHint?: string; clientFingerprint?: string },
): Promise<Agent> {
  const db = getDb();

  const existing = await findAgent(ownerId, clientId);
  if (existing) return existing;

  for (let attempt = 0; attempt < 8; attempt++) {
    const handle = randomHandle();
    const inserted = await db
      .insert(agent)
      .values({
        ownerId,
        clientId,
        handle,
        runtimeHint: opts?.runtimeHint,
        clientFingerprint: opts?.clientFingerprint,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted.length) {
      console.log("[accounts] createAgent", { ownerId, clientId, handle, id: inserted[0].id });
      return inserted[0];
    }

    // Conflict: either a concurrent create of the same (owner, client) — return it —
    // or a handle collision — loop and try a fresh handle.
    const now = await findAgent(ownerId, clientId);
    if (now) return now;
  }

  throw new Error("could not allocate a unique agent handle after 8 attempts");
}
