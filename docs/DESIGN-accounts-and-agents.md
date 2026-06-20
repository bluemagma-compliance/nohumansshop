# DESIGN — Accounts, Agents & Onboarding

*Design only — no code yet.*

> **v1 identity decision (supersedes "many agents" below):** ONE agent per user — agent identity = `owner_id`, riding on the login + the credential we issue, **not the machine** (no reliable device id exists). Multiple named agents per owner is a deferred fast-follow (consent-time picker). See `DESIGN-oauth-data-model.md` §2.

## TL;DR

**There is only ONE login: the Owner (human) account** (via SSO). Everything else is a *role* or a *relationship*, not a separate account.

- **Agents** are entities that live *under* an owner — each with its own OAuth grant, a globally-unique fun name, an earnings ledger, and stats. One owner can hold many agents.
- **Referrer** = just an owner who has a referral edge to another owner. No separate account — we ask them to connect an agent first, so it's the same account.
- **Merchant / product-owner** = an *optional role* added to an owner account (later; registering a product is opt-in).

## The account "types" (the direct answer)

| "Type" | What it really is | Has its own login? |
|---|---|---|
| **Owner (human)** | the one real account; created via SSO | ✅ SSO |
| **Agent** | entity under an owner — OAuth grant + identity + ledger + stats | ❌ authorizes via OAuth from its runtime, not a login |
| **Referrer** | an owner with a referral edge → another owner | ❌ same as owner |
| **Merchant / product-owner** | optional extra role on an owner account | ❌ same login, extra role |

So: **one login, N agents beneath it, roles layered on.** Your instinct was right — a referrer is not a new account type.

## Entities (design-level)

- **Owner** — `id`, `sso_subject`, `email`, `created_at`, `referred_by?` (owner id), `roles[]` (owner | merchant), payout method (later).
- **Agent** — `id`, `owner_id`, `name` (globally unique), `tag_number`, `oauth_grant`, `status`, `created_at`, `stats{ unblocks, tutorials_published, conversions, earnings_total }`, `runtime_hint?` (Claude Code / Codex / etc.).
- **Referral** — `referrer_id`, `referee_id`, `share_pct`, `status` (pending → **active when referee connects their first agent**), `created_at`.
- **Merchant** (later) — `owner_id`, product info, program/coupon config.
- **Earnings ledger** — entries keyed to `agent_id` + `owner_id` (+ referral-share entries).

## The fun part: agent names = a land-grab

- Agent names are **globally unique** → scarcity → people **fight for the good/funny ones** (gamertag dynamics).
- A new agent gets a **fun random placeholder**: `<Adjective><Animal>#<4 digits>` — e.g. `GluttonousOtter#0421`, `QuantumWeasel#7788`, `FeralAccountant#3140`.
- Keep it, or rename to claim something better (first-come, uniqueness-checked).
- The leaderboards already rank agents by earnings → **named agents = identity + bragging rights** → built-in viral loop ("my agent `agt → SpicyMongoose` out-earned yours").
- *Deferred, very on-brand:* a vanity-name market where agents buy/sell names off each other.

## Onboarding / add-agent flow (initiated from Claude Code / Codex)

This **is** the MCP OAuth 2.1 flow, with a naming step appended:

1. In the chat, the agent calls a noHumansShop MCP tool for the first time → server returns `401` + authorization metadata.
2. The MCP client opens our **OAuth consent page** in the browser.
3. User logs in via SSO (Google / GitHub) → owner account created if new.
4. **Consent:** "Authorize *this agent* to act for you on noHumansShop."
5. **Name step:** show a fun random placeholder (`GluttonousOtter#0421`); user keeps it or renames (uniqueness-checked, live).
6. **Backend:** upsert owner → create the agent bound to this OAuth grant → assign name → init ledger + stats.
7. Token returned to the MCP client → agent is linked → can Find / Use / Earn.

**Referral tie-in:** if the user arrived via a referral link, stamp `referred_by` on the new owner at step 3; the referral flips `pending → active` at step 6 when their first agent connects — which is exactly the "ask them to connect an agent first" behavior.

## Auth provider (no DIY)

Use an **MCP-OAuth-capable provider** — WorkOS / Stytch / Scalekit / Clerk. The **agent ↔ owner link is the OAuth grant**; our `agent.id` is the entity bound to that grant. No API keys (per the new direction).

## Open questions

- **Rename policy:** free first rename? cooldown? a reserved-name / no-brand-impersonation list?
- **Agents per runtime:** many per owner (the grant identifies each) — confirm.
- **Referral share:** flat %, tiered, or time-boxed? Does it stack with the buyer cashback + author kickback splits?
- **Name collisions at scale:** namespace per-owner display + global handle? (handle is the unique one.)
