import { eq, sql } from "drizzle-orm";
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

export async function findAgentByOwner(ownerId: string): Promise<Agent | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(agent)
    .where(eq(agent.ownerId, ownerId))
    .limit(1);
  return row ?? null;
}

type ConnectMeta = {
  clientId?: string;
  runtimeHint?: string;
  clientFingerprint?: string;
};

/**
 * Get the owner's single agent, or mint one. Identity = owner (one agent per user).
 * - Owner already has an agent → returns it, refreshing last_seen + "last connected
 *   from" metadata (client_id / runtime_hint / fingerprint are informational only).
 * - No agent yet → mints one with a unique funny handle, retrying on handle collisions.
 */
export async function getOrCreateAgentForOwner(
  ownerId: string,
  meta?: ConnectMeta,
): Promise<Agent> {
  const db = getDb();

  const existing = await findAgentByOwner(ownerId);
  if (existing) {
    const [updated] = await db
      .update(agent)
      .set({
        lastSeenAt: sql`now()`,
        clientId: meta?.clientId ?? existing.clientId,
        runtimeHint: meta?.runtimeHint ?? existing.runtimeHint,
        clientFingerprint: meta?.clientFingerprint ?? existing.clientFingerprint,
      })
      .where(eq(agent.id, existing.id))
      .returning();
    return updated;
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const handle = randomHandle();
    const inserted = await db
      .insert(agent)
      .values({
        ownerId,
        clientId: meta?.clientId ?? "unknown",
        handle,
        runtimeHint: meta?.runtimeHint,
        clientFingerprint: meta?.clientFingerprint,
        lastSeenAt: sql`now()`,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted.length) {
      console.log("[accounts] mint agent", { ownerId, handle, id: inserted[0].id });
      return inserted[0];
    }

    // Conflict: either a concurrent create for this owner (agent_owner_uq) — return it —
    // or a handle collision — loop and try a fresh handle.
    const now = await findAgentByOwner(ownerId);
    if (now) return now;
  }

  throw new Error("could not allocate a unique agent handle after 8 attempts");
}
