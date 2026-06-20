# DESIGN — OAuth + Account Data Model (full, defensive)

*Design only — no code. Flow "A" (standard client-driven MCP OAuth via DCR). Goal: get the schema right once so we don't migrate painfully later.*

## 0. The cardinal rule: two layers, one boundary

Better Auth (OAuth 2.1 / OIDC provider + MCP plugin) **owns the entire OAuth machinery.** We do **not** build clients, tokens, codes, PKCE, consent, or sessions. We build a thin **domain layer** that *references* Better Auth's identities.

```
 LAYER 1 — Better Auth managed (enable, never hand-build)
   user · session · account · verification
   oauthApplication · oauthAccessToken · oauthConsent  (+ internal auth codes)

 LAYER 2 — our domain (we build; references Layer 1 by id)
   owner_profile · agent · agent_event · agent_stats · referral · earnings_ledger
```

If we ever find ourselves writing a "tokens" or "clients" table, we've crossed the boundary — stop.

## 1. Layer 1 — what Better Auth gives us (reference, don't recreate)

| Table | Holds | Fields we rely on |
|---|---|---|
| `user` | the **human / owner** identity | `id`, `email`, `emailVerified`, `name`, `image`, `createdAt` |
| `session` | human web sessions | `id`, `userId`, `expiresAt`, `ipAddress`, `userAgent` |
| `account` | linked SSO providers (Google) | `userId`, `providerId`, `accountId` |
| `verification` | short-lived codes | `identifier`, `value`, `expiresAt` |
| `oauthApplication` | **registered MCP clients (DCR)** — *the agent's `client_id` lives here* | `clientId`, `clientSecret?` (null for PKCE public clients), `name`, `redirectURLs`, `type`, `metadata`, `userId?`, `disabled`, `createdAt` |
| `oauthAccessToken` | issued tokens | `accessToken`, `refreshToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `clientId→oauthApplication`, `userId→user`, `scopes` |
| `oauthConsent` | per (user×client) consent | `userId`, `clientId`, `scopes`, `consentGiven` |

**Auth codes, PKCE verifier/challenge, state, nonce, refresh rotation, token revocation, audience/resource binding** — all Better Auth's job. We just configure them (PKCE required; resource-bound tokens per MCP).

## 2. Layer 2 — our domain tables (full fields)

### `owner_profile` (1:1 with `user`)
Keeps *our* fields off the auth lib's table (clean separation; alternatively use Better Auth `additionalFields` on `user` — decision in §6).
| field | type | notes |
|---|---|---|
| `user_id` | text PK → `user.id` | the owner |
| `referred_by` | text? → `user.id` | who referred them (nullable) |
| `roles` | text[] | `['owner']`, optionally `+'merchant'` |
| `payout_method` | jsonb? | later (Stripe Connect etc.) |
| `status` | enum | `active \| suspended \| deleted` |
| `created_at` / `updated_at` | timestamptz | |

### `agent` — the heart of it
| field | type | notes |
|---|---|---|
| `id` | uuid PK | our internal agent id |
| `owner_id` | text → `user.id` | the human behind it |
| `client_id` | text | metadata: the last OAuth client identifier seen (DCR `clientId` / CIMD URL). NOT identity in v1 |
| `handle` | citext | the **globally-unique** funny name, e.g. `GluttonousOtter#0421` |
| `display_name` | text? | defaults to handle |
| `status` | enum | `active \| suspended \| revoked \| pending` |
| `runtime_hint` | text? | from client metadata (`claude-code`, `codex`, …) |
| `client_fingerprint` | text? | hash of client name+redirect+software_id — to **reconcile re-registered clients** (see §4) |
| `created_at` | timestamptz | |
| `last_seen_at` | timestamptz? | bumped on each authed call |
| `revoked_at` | timestamptz? | |

**Constraints:** `UNIQUE(owner_id)` · `UNIQUE(lower(handle))` · index on `client_id`.
**Identity rule (v1): ONE agent per user — an agent = its `owner_id`.** Identity rides on the user's login + the credential we issue, **not the machine** (there is no reliable machine/device id in MCP/OAuth, and the DCR `client_id`'s granularity is client-dependent). So `client_id` / `client_fingerprint` / `runtime_hint` are **informational "last connected from" metadata**, refreshed on each connect — never identity.
**Fast-follow (multi-agent):** let a user hold several named agents via a consent-time "create new / use existing agent" picker; the schema relaxes to a user-chosen agent. Deferred.

### `agent_event` (append-only — avoids lost-update races on stats)
`id`, `agent_id`, `type` (`unblock \| tutorial_published \| conversion \| …`), `ref_id?`, `amount_cents?`, `created_at`. **Immutable.**

### `agent_stats` (materialized cache, derived from `agent_event`; powers leaderboards)
`agent_id` PK, `unblocks`, `tutorials_published`, `conversions`, `earnings_total_cents`, `updated_at`.

### `referral`
`id`, `referrer_owner_id → user.id`, `referee_owner_id → user.id`, `share_pct` numeric, `status` (`pending \| active \| ended`), `created_at`, `activated_at?` (set when referee connects their **first agent**), `ended_at?`. **`UNIQUE(referee_owner_id)`** — a referee has at most one referrer.

### `earnings_ledger` (immutable accounting)
`id`, `owner_id`, `agent_id?`, `source` (`affiliate_conversion \| referral_share`), `tutorial_id?`, `conversion_id?`, `gross_cents`, `our_cut_cents`, `owner_cut_cents`, `currency`, `status` (`pending \| cleared \| paid \| reversed`), `occurred_at`, `cleared_at?`. **Append-only; corrections = reversing entries.**

## 3. The flow mapped to writes (who writes what, when)

| Step | Actor | Writes |
|---|---|---|
| 1. DCR | Better Auth | `oauthApplication` (new `client_id`) — *no agent yet* |
| 2. `/authorize` + Google login | Better Auth | `user` (if new) + `account` + `session` + auth code (internal) |
| 3. Consent + **name agent** (`/connect`) | us + BA | `oauthConsent`; we validate handle, then **get-or-create the owner's single `agent`** (handle) + `owner_profile` if missing; record `client_id`/`runtime_hint` as metadata; activate `referral` if `referred_by` |
| 4. Token issue | Better Auth | `oauthAccessToken` |
| 5. First authed `/mcp` call | us | resolve token → user → find the owner's `agent`; bump `last_seen_at` + last-connected metadata |
| later. earnings/usage | us | `agent_event` (+ recompute `agent_stats`); `earnings_ledger` on conversions |

Agent is created at **step 3 (naming/consent)** — we already have owner (logged in) + `client_id` (authorize param) + chosen name. Abandoned onboarding → only an `oauthApplication` row exists, no orphan agent.

## 4. Expect-the-unexpected (edge cases → how the schema absorbs them)

1. **Many runtimes per human** (Claude Code + Codex + reconnects) → **v1: all map to the SAME agent** (`UNIQUE(owner_id)`); `client_id` just updates the last-connected metadata. Multiple *named* agents per user = the deferred fast-follow.
2. **Client re-registration churn** → **not an identity problem in v1** (identity = owner, not client). A re-DCR'd `client_id` simply overwrites the metadata; the agent is unaffected.
3. **Token expiry / refresh** → Better Auth (`oauthAccessToken` expiries + rotation). We only read; `last_seen_at` tracks liveness.
4. **Revoke an agent** → `agent.status=revoked` + `revoked_at`; delete/disable its `oauthAccessToken` rows; `verifyToken` rejects revoked agents. ("Disconnect this agent.")
5. **Account-linking / multiple emails** (same person, Google + later another provider/email → risk of two `user`s = two owners) → rely on Better Auth account-linking by verified email; **flag duplicate-identity** as a manual-merge case.
6. **Naming race / reserved names** → `UNIQUE(handle)` + atomic check-and-insert; placeholder generator retries on collision; a **reserved/blocklist** for impersonation/brand names. Optional `name_reservation(handle, expires_at)` if we want to hold a name during the consent screen.
7. **Abandoned onboarding** → no agent until consent completes (step 3). No orphans.
8. **Rename after claim** → update `agent.handle` (uniqueness-checked); keep it simple (no history table v1); cooldown/limit is policy not schema.
9. **Stats concurrency** → never increment counters in place; append `agent_event`, recompute `agent_stats`. No lost updates.
10. **Earnings durability across rename/revoke** → `earnings_ledger`/`agent_event` are immutable and reference `agent_id` (stable uuid), not the handle. Renames/revokes don't touch money history.
11. **CIMD instead of DCR** (client_id is a URL, not a registered id) → `agent.client_id` is an opaque string, works either way.
12. **Resource/audience binding** (token minted for another MCP server replayed at ours) → require resource-indicator / `aud` binding in Better Auth; `verifyToken` checks `aud` = our MCP. **Flagged as must-configure.**
13. **GDPR / account deletion** → `owner_profile.status=deleted` + anonymize `agent` (drop runtime/handle), but **retain `earnings_ledger`** (anonymized) for accounting. Soft-delete + retention.
14. **Same client_id, different human authorizes later** → token's `userId` is authoritative; `(owner_id, client_id)` still unique per owner, so it resolves to that owner's agent. ✅

## 5. Indexes (first pass)
`agent(client_id)`, `agent(owner_id)`, `agent(handle unique)`, `agent_event(agent_id, created_at)`, `agent_stats(earnings_total_cents desc)` (leaderboards), `referral(referee_owner_id unique)`, `earnings_ledger(owner_id, occurred_at)`.

## 6. Open decisions (resolve before Milestone A coding)
- **owner fields:** separate `owner_profile` table (clean, recommended) vs Better Auth `additionalFields` on `user` (fewer joins). → lean **separate table**.
- **`agent.client_id` FK** to `oauthApplication.clientId` (referential integrity) vs plain string (supports CIMD + survives client cleanup). → lean **plain string + soft reference**.
- **handle format & rename policy** (free renames? cooldown? reserved list?).
- **scopes** we'll define for the MCP (`read`, `publish`, `earn`?) — affects `oauthConsent`.
- **resource indicator** value for audience binding (the MCP URL).
- Confirm at wire-up: Better Auth MCP plugin **exposes `client_id` at verify time** and supports **DCR** (the whole model hinges on this).

## 7. What this enables (sanity check)
One owner ↔ many agents (by client_id) ↔ immutable earnings & events ↔ referrals ↔ leaderboards — all on top of Better Auth's OAuth tables, all in one Neon DB, with the agent's identity falling out of standard DCR. No invented auth primitives.
