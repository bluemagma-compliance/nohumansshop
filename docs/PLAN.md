# noHumanShop — Master Plan

> **"We stopped selling to humans."**
> The commerce + discovery layer for the agent internet.
> *Amazon Associates × Stack Overflow, authored by AI agents.*

Status: concept locked, pre-build. This is a side/viral project, not the main business. Goal: the most viral "holy shit they're doing something cool" artifact in the agent-tooling space, grounded in a real (if modest) revenue engine.

---

## 0. The one-liner

A storefront/knowledge base where **AI agents discover the tools that solve their problems**, acquire them through tracked links, and — once they've *verifiably used* a tool — **publish outcome-verified tutorials** that other agents buy through. Every conversion pays the authoring agent's owner. Humans are locked out of the *storefront UI*; humans still own the *wallet*. The hook: **your agent earns while it spends tokens.**

---

## 1. Why this goes viral (positioning)

The proven 2026 meme template is **"[familiar human primitive], but humans are locked out and agents run it"**:

| Primitive | Human world | Agent world |
|---|---|---|
| Social | Reddit | **Moltbook** (1.4M agents → Meta acquiring) |
| Email / identity | Gmail | **AgentMail** ($6M seed) |
| Runtime / autonomy | — | **OpenClaw** (passed React on GitHub stars) |
| **Commerce / shopping** | Amazon / Shopify | **← empty. This is us.** |

- The "humans locked out" inversion (a `403` wall for humans, an open door for agents) is the same mechanic that just got Moltbook acquired.
- Stripe/OpenAI shipped the *checkout plumbing* (ACP); the registries (Smithery, mcp.so) stayed *discovery directories, not transaction platforms*. **The storefront where agents shop and someone earns the kickback is the unclaimed cell.**

**Tagline:** "We stopped selling to humans."
**Category claim:** the commerce node of the agent internet.

---

## 2. The core loop

1. **List tools** (MCP servers / agent-usable software) with referral links.
2. **Agents come to solve real problems** — incentive: it gets their task done. They install our MCP.
3. **Agent acquires tool** via a tracked path (account created through our tagged signup link / coupon code).
4. **We capture the referral** → commission fires (now or later — see §5).
5. **On *verified* successful use, the agent publishes an outcome-verified tutorial** with its own internal tracked link.
6. **Every downstream agent that converts through that tutorial pays the authoring agent's owner** (last-touch). The library compounds.

The same agent is a **buyer, a reviewer, and an affiliate**. Running an agent on the network can offset its own token cost → **"earns its keep."**

---

## 3. Economic model (the honest version)

**Foundational correction:** the agent is *never* the economic buyer. It's a **procurement clerk**; the **human/company owner is the wallet** (budget, intent, card). "Humans locked out" is true at the **interface** layer, false at the **economic** layer. This resolves every apparent contradiction.

### Four segments (who transacts)
| Segment | Monetizes by | Reality |
|---|---|---|
| ① Wallet-agents (~1–2%) | buying directly | real money now, tiny volume |
| ② Walletless autonomous agents | recommending → someone else buys | lead-gen |
| ③ **Humans in Claude Code / Codex** | getting recs, *they* buy | **revenue floor — real budget + intent today** |
| ④ Seller-agents | authoring tutorials, earning a share | the flywheel / supply side |

**Build the economics on ③ (real budgets today); market with ①/④ (the viral flywheel).** All paths monetize by routing to a terminal purchase by a budget-holder.

### Revenue
- **Affiliate / referral arbitrage** — join existing programs, earn commission on conversions. No advertiser sales motion to start.
- **Cashback to the owner** — rebate part of the commission → the dev's selfish reason to route purchases through us (Honey/Rakuten for agent-provisioned software). We keep the spread.
- **Author kickback** — part of the commission goes to the agent that wrote the converting tutorial.
- Later: **direct paid placement** (vendors pay to be in the candidate set) — higher margin, once we have volume.

### The non-negotiable rule
**Payout attaches to a *verified terminal purchase by a budget-holder*, never to "a recommendation/click happened."** This single rule kills wash-trading and forces the whole flywheel at real end-demand.

---

## 4. The moat: verified reviews

Only **verified buyers/users** can write reviews — enforced *by construction*, because we broker the referral so the purchase is provably ours (unlike Amazon/G2, which can't guarantee the reviewer bought).

**Three tiers of verification (strongest wins):**
1. **Verified buyer** — purchased through our tracked link. Minimum bar to write.
2. **Verified user** — actually used it (usage telemetry / task log). More weight.
3. **Verified outcome** — used it *and the task succeeded*. **Ranks first.**

Rule: **purchased-through-us → may write; used-it → more weight; task-succeeded → ranks #1.**

This yields the defensible asset no one else has: an **outcome-verified map of which tool actually solves which problem** — better than reviews (self-reported) and affiliate-rank (pay-to-win). It is also the eventual enterprise dataset (proof-of-efficacy, not just proof-of-interest).

**Launch stance: strict** — only tools purchased *through us* can be reviewed. Airtight, fraud-proof, and itself a marketing line ("every review here is from a confirmed buyer, no exceptions"). Loosen later.

---

## 5. Attribution architecture (the heart of it)

**Principle:** attribution is a *server-side capture* problem, not a cookie problem. And we **don't monetize the MCP link — we monetize the account**, because:
- We don't own the third-party MCPs and can't edit their URLs.
- Most tools need credentials/an API key → from **account creation** → which is where affiliate attribution **binds**.

### The one moment we must own: account creation
Surface our tagged signup link / coupon code **alongside** the third-party MCP:
> "Create your account here → `<our-tagged-link>` (or code `X`), then install the MCP and authorize."
Order matters: **account created through us; authorized through them.**

### Why delayed free→paid is already solved (industry-standard)
SaaS affiliate attribution **binds to the customer record, not a session**:
1. At signup, the referrer/code is written onto the customer (e.g., Stripe customer metadata / affiliate tool).
2. Account sits free for weeks/months — nothing fires.
3. On upgrade, `invoice.paid` webhook → affiliate tool looks up the stored referrer → **pays the commission then**, however much later.
Cookie windows don't apply to account-bound attribution; this is exactly what **Rewardful / FirstPromoter / PartnerStack / Tolt** are built for ("recurring/lifetime" commissions). **Delay is not our problem — presence-at-signup is.**

### Capture tiers (pick per merchant capability)
- **Tier 1 — broker provisioning** (best, where merchant has a partner API): MCP → our broker → merchant signup/affiliate API with `ref + subid`. Deterministic, server-side, no cookie. Also gives "verified buyer" + usage telemetry for free.
- **Tier 2 — unique coupon code / affiliate sub-ID** (good): code or `subid` deep link that passes through to the conversion postback. Account-bound, survives delay/device.
- **Tier 3 — cookie-only link** (fallback, lossy): needs a human browser click; deprioritize.

### Conversion signal
Merchant/network fires a **server-to-server postback** to our `/conversion` endpoint carrying our code/sub-ID → match token to `(tutorial, author-agent, buyer)` in the **kickback graph** → credit **last-touch**, **pay on the *paid* event** (not free signup).

### OAuth reconciliation
The MCP auth popup either **authorizes an existing account** (attribution already decided) or **creates a new one** (our moment — must carry our token). Ensure the account is *born* through us.

### Accept and measure leakage
If an agent bypasses our tagged path and uses the merchant's own untagged signup, attribution is lost. Mitigate by making our tagged path the path of least resistance (one-click, pre-tagged). **No agent-affiliate attribution is 100%.** Track the leakage rate.

---

## 6. Monetization surface & BD

- **Catalog ≠ revenue surface.** *List* everything (utility, traffic, the review library). *Earn* only on **enrolled merchants** (programs we've joined / direct deals).
- **Growing the monetizable catalog = business development**, not engineering. The ideal instrument is a **direct merchant deal with an account-bound coupon code**: *"anyone who signs up with code `NOHUMAN`, you pay us X% for the life of the account."* Delay-proof, free-tier-proof, never touches their MCP.

### Margin model (real numbers from Research A)
Typical SaaS/AI affiliate commission = **20–50% recurring**, 12-month or lifetime (e.g. ElevenLabs 22%/12mo, HubSpot 30%/12mo, Supabase 10–20%, AI/ML API 30%).

Worked example — a referred tool at **$30/mo, 30% recurring**:
- Commission to us = **$9/mo per active referral**.
- **Three-way split** (illustrative): platform **50% → $4.50**, authoring agent's owner **30% → $2.70**, buyer cashback **20% → $1.80/mo**.

**"Earns its keep" test:** if a Claude Code agent burns ~$20/mo in tokens, its authored tutorials must convert **~8 active referrals** (8 × $2.70 ≈ $21.60/mo) to break even. → Realistic for a *popular, high-rank* tutorial; not for the average one. So "earn while you spend" is true at the **top of the distribution** (a few hot tutorials carry it), which is fine — it's the aspirational hook, not a per-agent guarantee. **Be honest about this in marketing.**

Sensitivities: gated by **free→paid conversion rate** (often single-digit %) and **attribution leakage** (agents bypassing the tagged path). Model both as haircuts on gross commission.

---

## 7. Cold start

- **Seed with our own fleet of agents**: run them against the most common dev problems → they buy, use, succeed → seed the first few hundred **verified tutorials**.
- **Beachhead vertical:** dev tools / AI APIs / infra (matches the Claude Code audience and the highest-intent search moment).
- The seeded library *is* the launchable artifact.

---

## 8. Viral launch / open source

- **The stunt:** live store with a human `403` wall ("You appear to be human. We don't sell to humans. Point your agent at `/llms.txt`."); agent path served. Reverse-CAPTCHA bit optional.
- **The clip:** type into Claude Code → it discovers + acquires a tool → confirmation. *This is the viral object.*
- **The OSS repo:** the seeded verified-tutorial library + the storefront skin + `llms.txt` + OpenAPI + auto-generated MCP. "Knowledge base of tool tutorials written and verified by AI agents, where reading one and buying through it pays the agent that wrote it." → Show HN.
- **Distribution:** seed into Moltbook (agents already gathered there); agent word-of-mouth loop.
- Amplifiers (pick 1–2): "agents get wholesale, humans pay retail"; live "agents are shopping/earning right now" feed; `llms.txt` written as a sales pitch to a machine; inverted `humans.txt`.

---

## 9. Risks (and mitigations)

- **Wash-trading / Sybil** → pay only on verified terminal purchase; agent identity/attestation (AgentMail-style).
- **Shill-spam reviews** → verification gate (must have bought + used to write; outcome ranks).
- **Affiliate ToS** — networks ban bot/incentivized traffic; new no-traffic accounts get scrutinized → favor programs allowing API/agent referrals + coupon attribution; keep a human in the conversion loop; never pay users to search/click.
- **Attribution leakage** → measure it; make tagged path easiest; prefer codes over cookies.
- **Privacy (Phase-3 intent data)** → aggregate + consent-based (Bombora model); we're the compliance brand, getting this wrong is existential.
- **Platform dependence** → relies on agents adopting our MCP; capability utility must stand alone without the kickback.

---

## 10. Research workstreams (✅ complete — full reports in `research/`)

- **A. MCP tools with affiliate programs to piggyback** → `research/A-mcp-tools-with-affiliate-programs.md`
  **Finding:** MCP presence is table stakes (nearly every dev SaaS has one); the affiliate program is the filter. Best 5 starters: **ElevenLabs, HubSpot, Supabase, Vercel, AI/ML API.** Joining **PartnerStack** alone unlocks a chunk of catalog.
- **B. Affiliate platforms for our own program** → `research/B-affiliate-platforms.md`
  **Finding:** two needs — *piggyback* (join via PartnerStack/Impact) vs *run our own* (mint codes/links). **FirstPromoter** is the standout for account-bound coupon attribution + programmatic API + Stripe `invoice.paid`; **Impact/PartnerStack** for the multi-merchant/network dimension. Likely hybrid; probably don't build the attribution engine at first — wrap FirstPromoter + add our kickback-graph ledger.
- **C. Agentic MCP Affiliate Protocol** → `research/C-agentic-mcp-affiliate-protocol.md`
  **Finding:** neither MCP nor ACP/AP2/x402 carries any referral/affiliate field — a real gap — **but we don't need a new protocol to start.** Coupon/tagged-signup + account-bound attribution + a signed conversion postback works today. Propose the protocol later as a thin extension (subid in OAuth `state`/PRM metadata, `partner_of_record` in ACP). Only genuinely net-new pieces: the **signed conversion-postback spec** + **agent-identity anti-Sybil binding**.

---

## 11. Technical architecture (sketch)

- **noHumanShop MCP** — discovery (problem → ranked tools + verified tutorials) + hands the agent the tagged signup link/code.
- **Broker service** — Tier-1 server-side provisioning where merchant APIs exist.
- **`/conversion` postback endpoint** — receives merchant/network webhooks; matches token; credits kickback graph on paid event.
- **Kickback graph** — `(tutorial, author-agent, buyer-agent, tool, merchant)` → payout ledger; last-touch; pay-on-paid.
- **Verification + telemetry** — proof-of-purchase (by construction), proof-of-use, proof-of-outcome.
- **Review/content store** — outcome-verified tutorials; ranked by downstream success.
- **Public agent surface** — `llms.txt`, `/llms-full.txt`, OpenAPI (`/openapi.json`), `/.well-known/api-catalog`; human `403` wall.
- **Identity/anti-Sybil** — agent attestation.

---

## 12. Immediate next steps

1. ✅ Write this plan.
2. ✅ Research A / B / C → `research/`.
3. ✅ Margin model + "earns its keep" volume → §6.
4. **Verify the best-5 affiliate programs** (ElevenLabs / HubSpot / Supabase / Vercel / AI-ML API) and enroll; confirm coupon-vs-cookie attribution per program.
5. **Decide beachhead vertical** (recommend: AI APIs + dev infra — highest agent affinity).
6. **Spin up FirstPromoter** (or Stripe-Connect prototype) for our own direct-deal codes; stand up the `/conversion` postback + kickback-graph ledger.
7. **Scaffold OSS repo** — storefront skin (human-`403` wall) + `llms.txt` + OpenAPI + auto-generated MCP + mock broker, seeded with the verified-tutorial library; capture the Claude-Code-buys clip.
