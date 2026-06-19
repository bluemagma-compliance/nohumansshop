# TECH-STACK — keep it stupid-simple

**Goal:** ship the whole thing with **one app, one database, one deploy target, zero orchestration.** Your worry ("not sure how possible that is") — it's very possible. Here's the minimal stack.

## The one-paragraph answer

**One Next.js app on Vercel** hosts everything — the viral landing page, the JSON API (with OpenAPI), *and* the MCP server (via Vercel's `mcp-handler`). **One Neon Postgres database (with `pgvector`)** holds everything — the catalog, the affiliate links, the kickback ledger, *and* the document embeddings for vector search. No queues, no microservices, no second database. That's the entire backend.

## Component-by-component

| Need | Pick | Why simplest |
|---|---|---|
| **Hosting** | **Vercel** (free tier you have) | one `git push` deploys app + API + MCP together |
| **App framework** | **Next.js (App Router)** | landing page + API routes + MCP in one codebase |
| **Database** | **Neon Postgres + `pgvector`** | `CREATE EXTENSION vector;` → relational data **and** vector search in one DB, one query. Serverless, you already use Neon. |
| **Embeddings** | **OpenAI `text-embedding-3-small`** | one API call per chunk; you already have an OpenAI key in the stack. (Voyage AI is the Anthropic-aligned alternative.) |
| **Vector search** | **pgvector cosine + SQL filters** | single SQL query: nearest-N embeddings *filtered by* category/flags — no separate vector DB |
| **API + spec** | **Next.js route handlers + Zod → OpenAPI** | Zod schema is the single source of truth; auto-generate `/openapi.json` |
| **MCP server** | **`vercel/mcp-handler`** (a.k.a. `mcp-for-next.js`) | drop an MCP server onto a Next.js route; lives in the same app; deploys to Vercel free |
| **MCP auth** | **API key in `X-API-Key` header** (`MCP_API_KEY` env var) | "simplest auth in the world" — exactly what you asked. OAuth 2.1 is the *standard* upgrade path later. |
| **Bulk doc upload** | endpoint/script → chunk → embed (OpenAI) → store in pgvector | for true bulk, a one-off script beats a job queue at V1 |

## Why NOT Mongo (you have Atlas, but skip it for V1)

You have Mongo Atlas *and* Neon. Using **both** = two databases to sync = the "crazy orchestration" you want to avoid. **Neon Postgres + pgvector does relational + vector in one place**, and research shows pgvector is the simpler path for "SQL filters + vector search in a single query." Keep Mongo in your back pocket; **V1 = Neon only.**

## The whole architecture, one diagram

```
        ┌──────────────────────── Vercel (one Next.js app) ─────────────────────────┐
        │                                                                            │
 humans │  /                    → landing page ("we stopped selling to humans")      │
 agents │  /api/*               → JSON API + /openapi.json  (Zod-typed)              │
 agents │  /mcp                 → MCP server (mcp-handler), X-API-Key auth           │
        │  /api/ingest          → bulk doc upload → chunk → embed                     │
        └───────────────────────────────────┬────────────────────────────────────────┘
                                             │
                          ┌──────────────────▼───────────────────┐
                          │      Neon Postgres + pgvector         │
                          │  catalog · links · kickback ledger ·  │
                          │  doc chunks + embeddings (vectors)    │
                          └───────────────────────────────────────┘

 external (read-only):  OpenAI embeddings API · affiliate platform APIs (Skimlinks/PartnerStack)
```

## Landing page — Moltbook-style viral

Direction (Moltbook = "front page of the agent internet," terminal/retro, agent-first):
- **Hero:** big, deadpan "We stopped selling to humans." + a reverse-CAPTCHA / "prove you're NOT human" gag.
- **The 403 bit:** a mock of what a human "sees" vs what an agent gets (`/llms.txt`).
- **Live feed (mock at first):** "agents shopping / earning right now" scroller.
- **One-liner thesis:** "Humans pay retail. Agents pay wholesale."
- Dark, monospace, minimal — looks like a terminal, not a SaaS marketing page.
- ⚠️ Keep this on the public marketing surface — **NOT** the URL you submit for affiliate approval (see README / SPEC §2).

## Build order (when we start coding)

1. `create-next-app` → deploy empty to Vercel (prove the pipe).
2. Neon DB + `pgvector`; schema for catalog / links / ledger / doc_chunks.
3. MCP server via `mcp-handler` + `X-API-Key` auth; one trivial tool (e.g. `search_tools`).
4. Ingest endpoint/script → embed → pgvector; vector-search tool for agents.
5. API routes + Zod → `/openapi.json`.
6. Landing page.
7. Wire the affiliate adapters (Skimlinks/PartnerStack) per the SPEC.

## Sources
- Vercel MCP adapter / handler: https://github.com/vercel/mcp-handler · https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel · https://github.com/vercel-labs/mcp-for-next.js
- Minimal MCP API-key auth: https://workos.com/blog/best-mcp-server-authentication-providers · https://github.com/sdiehl/mcp-on-vercel
- pgvector vs Atlas (simplicity): https://zilliz.com/comparison/pgvector-vs-mongodb-atlas · https://pecollective.com/tools/pgvector/
- OpenAPI → MCP: https://xata.io/blog/built-xata-mcp-server
