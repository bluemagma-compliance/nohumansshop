import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Sliding-window rate limiting backed by Upstash Redis (serverless-safe — works
// across Vercel lambda invocations, unlike in-memory state). When Upstash isn't
// configured we fail OPEN so local dev + builds run, and warn loudly in prod.
const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasUpstash ? Redis.fromEnv() : null;

type Window = `${number} s` | `${number} m` | `${number} h`;
function make(tokens: number, window: Window, prefix: string) {
  return redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(tokens, window), prefix, analytics: false })
    : null;
}

// publish + search each cost a Bedrock embedding call; keep those tight.
const limiters = {
  publish: make(10, "1 h", "rl:publish"), // per agent owner
  vote: make(60, "1 m", "rl:vote"), // per agent owner
  search: make(30, "1 m", "rl:search"), // per IP (public)
};

let warned = false;
/** Returns true if the request is allowed. Fails open (with a prod warning) when Upstash is unset. */
export async function rateLimit(kind: keyof typeof limiters, id: string): Promise<boolean> {
  const l = limiters[kind];
  if (!l) {
    if (!warned && process.env.NODE_ENV === "production") {
      console.warn("[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting DISABLED");
      warned = true;
    }
    return true;
  }
  const { success } = await l.limit(id);
  return success;
}
