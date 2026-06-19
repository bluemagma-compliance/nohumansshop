# SPEC — Affiliate Link Engine + Agent-Native Translation Layer

**Problem:** To populate the store we need (1) existing SaaS products that have *both* an MCP and an affiliate program, (2) to enroll/collect referral links that pay back to us, (3) to **translate those existing affiliate links into AI-agent-native referral links**, and (4) to build our **own ground-up affiliate engine** that lets anyone create agent-native links for their product. This spec covers all four, grounded in real ecosystem + policy data.

---

## 0. The reframe that anchors everything: **we are a sub-affiliate network for AI agents**

The thing you're describing already has a proven shape in the human web: **sub-affiliate networks** (Skimlinks, Sovrn/VigLink).
- They **plug into the big networks** (Impact, ShareASale/Awin, CJ) with one integration, **house many publishers** under one umbrella, **auto-convert ordinary outbound links into affiliate links**, and **take a rev-share cut**, sharing the rest with publishers.
- Scale proof: **Skimlinks = one contract → ~48,500 merchants + 50+ networks**; **Sovrn ≈ 30,000 merchants**.

**noHumanShop = Skimlinks/Sovrn, but the "publishers" are AI agents and the "link" is an agent-native referral object.** This gives us a template, a build-vs-partner shortcut (we can *sit on top of* Skimlinks/Sovrn on day one instead of contracting 50 networks), and a known regulatory posture.

---

## 1. Ecosystem primer (the players, since this is unfamiliar territory)

| Layer | What it is | Examples | Our relationship |
|---|---|---|---|
| **Affiliate networks** | Marketplaces connecting merchants ↔ affiliates; handle tracking + payout | **Impact, CJ, Awin/ShareASale, Rakuten** | We *join* as an affiliate (piggyback) |
| **In-house affiliate tools** | A single SaaS runs its *own* program | **FirstPromoter, Rewardful, Tolt, PartnerStack** | We join each program; later use FirstPromoter to run *our own* |
| **Sub-affiliate networks** | Aggregators that wrap many networks, auto-convert links, sub-distribute to publishers, take a cut | **Skimlinks, Sovrn** | **This is the category we are** (agent-native) |
| **Agent ad/affiliate** | Agent-facing monetization | ChatAds, Agentic Ads, MCPize, Koah | Adjacent / partial competitors |

**Two roles we play:**
- **Role 1 — Piggyback (be the sub-affiliate):** collect existing programs' links/codes, translate them, serve to agents, earn commission, share with author-agents. Fastest path to a populated store.
- **Role 2 — Run our own engine:** merchants enroll *on us* and we mint agent-native links/codes for their products. Higher margin, our IP, but needs BD + the engine below.

---

## 2. Policy constraints (REAL DATA — these are hard requirements, not nice-to-haves)

> These shaped the design. Each is sourced; items marked ⚠️ need primary-source confirmation per merchant/network before launch.

1. **Incentivized/cashback traffic is allowed — but only from *approved cashback/loyalty affiliates*.** Our cashback model is legitimate **if we register/are approved as a cashback-loyalty platform** with each network/merchant. Individual advertisers can still ban incentivized traffic → **per-merchant approval gating is mandatory.** ⚠️ confirm per program.
2. **You may only advertise coupon codes *distributed by the merchant*.** Inventing your own codes for a piggybacked merchant = sales canceled. → For piggyback merchants, use **merchant-issued codes only**; we can only mint our *own* codes for **direct-deal merchants** (via FirstPromoter/Stripe). ⚠️
3. **FTC material connection extends *through the affiliate chain*, and AI-generated endorsements must be disclosed (May 2026 guidance).** Because we're a sub-network, disclosure obligations **flow through to us and to the agent-authored tutorial.** Every tutorial with an affiliate link MUST carry **(a) a clear+conspicuous affiliate disclosure near the link** and **(b) an AI-generated-content disclosure.** Penalties cited up to **~$51K**. **Bake disclosure into the content schema — non-optional.**
4. **Third-party cookies are effectively dead in 2026** (Safari/Firefox block). Cookie-based attribution is *not viable* for us regardless of the agent problem. → **Coupon codes + server-to-server (S2S) postback are the only robust methods.** S2S stores a click-ID server-side at click time, so attribution holds regardless of journey length or device; coupon codes skip clicks entirely. Last-click is the prevailing credit rule.
5. **No brand-impersonation / typosquatting; affiliates must be clearly identified.** Standard network term — our broker endpoints and agent identity must not mimic merchant brands. ⚠️

**Compliance posture:** we are a *compliance company* — getting this wrong is existential. Disclosure + cashback-approval + merchant-issued-codes are first-class product requirements.

---

## 3. What an "agent-native referral link" actually is (the translation target)

A human affiliate link is a **browser URL that sets a cookie**. That's useless to an agent (no browser, no cookie, cookies dead). An **agent-native referral link is a structured, machine-readable object** the MCP returns:

```jsonc
{
  "tool_id": "elevenlabs",
  "acquire": {
    "method": "account_create",            // account_create | apply_coupon | broker_api
    "signup_url": "https://nohuman.shop/go/<opaque-token>",  // OUR broker endpoint, not the raw merchant URL
    "coupon_code": "NOHUMAN-XYZ",          // merchant-issued (piggyback) OR our-minted (direct deal)
    "attribution_type": "coupon|s2s|cookie_fallback"
  },
  "subid": "<base64(tutorial_id|author_agent|buyer_agent)>",  // the kickback-graph token
  "disclosure": {
    "affiliate": "Sponsored — we earn a commission if you sign up.",
    "ai_generated": "This recommendation was produced by an AI agent."
  },
  "merchant_of_record": "ElevenLabs Inc.",
  "fallback_human_click": "https://...tagged...",  // only if merchant is cookie-only
  "policy_flags": ["cashback_approved", "merchant_coupon_only"]
}
```

**Translation = transform a raw program (browser URL + cookie) → this object**, choosing **coupon > S2S > cookie-fallback**, attaching the subid + the mandatory disclosure, and routing through **our broker endpoint** (so we capture the event server-side). Where a merchant only offers a cookie link, the translation **degrades gracefully** to a human-click fallback and flags lower attribution confidence.

---

## 3.5 Platform APIs, catalogs & the translation adapter (technical mechanics)

**Good news: we don't build link infrastructure — every network already has a merchant catalog + a link-generation API.** We hand it `(advertiser_id, destination_url, our_subid)` and get a tracking link back.

| Platform | Type | Pre-listed catalog? | Link-gen API | SubID param | Notes |
|---|---|---|---|---|---|
| **Impact.com** | Network | ✅ Search-catalog-items API (per-product tracking URLs) | `POST …/Programs/<id>/TrackingLinks`, `u`=deep link | `SubId`/`SharedId` | — |
| **Awin** | Network | ✅ advertiser list | Link Builder API (single or batch≤100), OAuth2 | `clickref` (+`clickref2-6`) | can gen links to **not-yet-joined** advertisers |
| **CJ** | Network | ✅ advertiser + product (GraphQL) | Deep Link Generator + Link Search REST | `sid` | REST **and** GraphQL |
| **Skimlinks** | Sub-affiliate | ✅ Merchant API (~48,500 merchants) | Link API (affiliatizes any URL) | `xcust` | Merchant API = Managed/premium tier |
| **Sovrn** | Sub-affiliate | ✅ merchant data API (~30k) | Redirect API (stitches the link) | their param | programmatic build |
| **PartnerStack** | SaaS network | ✅ joined programs | Partner API | their param | many AI SaaS live here |
| **FirstPromoter / Rewardful** | *Own-program* tool | ❌ (it's our own product) | mint codes/links via API | n/a | for running **our own** program |

### The money mechanic: SubID carries the kickback graph
A generated link carries two ids: **(1) our publisher/affiliate id** (network pays commission to us) and **(2) a SubID** the network echoes back on click + conversion. We **encode the kickback graph into the SubID**: `subid = encode(author_agent_id | buyer_agent_id | tutorial_id)`. The network pays **us** and has no concept of "the user"; the returned SubID lets **our ledger** split the commission to the author-agent's user + buyer cashback. **The SubID is the bridge between the network's flat "pay the publisher" model and our multi-party graph.**

### Translation = adapter pattern (differs per platform, but normalizable)
One **normalized agent-native link object** (§3) in the middle; **one adapter per network** on the edges. Each adapter knows how to: ① query that catalog, ② call its link-gen API, ③ map our token into its SubID slot, ④ parse its conversion report back into our ledger. Adding a network = adding an adapter.

**What varies per platform:** link format; API endpoint + auth (OAuth2/dev-token/API-key); SubID name + slot count; catalog shape (REST vs GraphQL); deep-link permissions; which attribution methods (link/coupon/S2S) are offered.

### Two buckets (keep distinct)
- **Catalog networks** (Impact/Awin/CJ/Skimlinks/Sovrn/PartnerStack) — merchants already listed → we *generate links to them* (piggyback/collection path).
- **Own-program tools** (FirstPromoter/Rewardful) — no catalog; a *new* merchant lists *their* product on *our* engine and we mint *their* codes (ground-up engine path).

---

## 4. Sub-system A — Link collection + translation (piggyback, ship first)

**Flow:**
1. **Source programs** — either (a) **sit on Skimlinks/Sovrn** (one integration → tens of thousands of merchants, fastest) or (b) **join networks/programs directly** (Impact, PartnerStack, in-house) for the best-5 (ElevenLabs, HubSpot, Supabase, Vercel, AI/ML API) at full margin.
2. **Get approved as a cashback/loyalty affiliate** per network/merchant (policy #1). Track approval status per merchant.
3. **Ingest** the program's affiliate link / merchant-issued coupon + commission terms + attribution method.
4. **Translate** → agent-native object (§3), attaching subid + disclosure, routed via broker endpoint.
5. **Cross-reference** with MCP availability (registry crawl) → only surface tools that are agent-usable (Research A rubric).
6. **Serve** via our MCP + tutorial library; record click at broker; receive **S2S postback** on conversion → kickback graph.

**Decision — partner vs direct:** start on **Skimlinks/Sovrn for breadth** (instant catalog, they handle network contracts + some compliance) *and* **direct on the best-5 for margin**. Migrate high-volume merchants from sub-network to direct over time (capture the cut Skimlinks/Sovrn take).

---

## 5. Sub-system B — Ground-up affiliate engine for AI agents (our IP)

For merchants who want **agent-native links for their own product**, built from scratch:

**What a merchant does:**
1. Sign up on noHumanShop, connect billing (Stripe via **FirstPromoter**, or our Stripe-Connect layer).
2. Define commission (%, recurring/lifetime, bounty) + cashback allowance + whether agent-completable.
3. We **mint**: a merchant-scoped coupon code (FirstPromoter Stripe-coupon API) + a tagged signup URL + the agent-native object.
4. We register the conversion **webhook** (`invoice.paid`) → our `/conversion` endpoint.

**What the engine provides:**
- **Programmatic mint API** — create/rotate agent-native links + codes (agents/automation need this, not a dashboard).
- **Account-bound attribution** — referral stamped on the customer; delayed free→paid still pays (FirstPromoter does this natively).
- **`/conversion` S2S postback receiver** — verify signature, match subid → kickback graph → credit last-touch, **pay on the *paid* event**.
- **Kickback-graph ledger** — `(tutorial, author-agent, buyer-agent, tool, merchant)` → split: platform / author / buyer-cashback.
- **Disclosure injector** — auto-attaches FTC affiliate + AI disclosures to every served link/tutorial.
- **Agent identity / anti-Sybil** — attestation gate before payout (stops wash-trading).

**Build vs buy:** wrap **FirstPromoter** (coupon API + Stripe webhooks + account-bound) for the attribution engine at first; build only the **agent-native translation, the kickback-graph ledger, the disclosure injector, and identity** on top. Go fully custom on Stripe Connect only when multi-merchant splitting forces it.

---

## 6. Attribution architecture (consolidated)

- **Primary: coupon code** (merchant-issued for piggyback; our-minted for direct). Cookie-proof, device-proof, account-bound, survives delay.
- **Secondary: S2S postback + sub-id** — click-ID stored server-side at our broker; merchant fires postback on conversion. Most accurate 2026 method.
- **Fallback: cookie link + human click** — only for cookie-only merchants; flag low confidence; expect leakage.
- **Credit rule: last-touch; pay-on-paid (not on free signup).**
- **Never rely on third-party cookies.**

---

## 7. Data model (sketch)

- `merchant` — id, name, source (skimlinks|sovrn|impact|partnerstack|in-house|direct), commission_terms, cashback_approved, coupon_policy (merchant_only|we_mint), attribution_methods[], mcp_available.
- `agent_native_link` — id, merchant_id, method, signup_url, coupon_code, attribution_type, disclosure, policy_flags[].
- `subid_token` — encodes tutorial_id, author_agent_id, buyer_agent_id; opaque, signed.
- `click_event` — subid, ts, agent_id (broker-logged).
- `conversion_event` — subid, merchant_id, paid_amount, event_type(account_created|paid), verified.
- `kickback_ledger` — conversion_id, splits{platform, author, buyer_cashback}, status.
- `disclosure_record` — per served tutorial (FTC audit trail).

---

## 8. Open items needing PRIMARY-SOURCE verification before launch

- ⚠️ Exact **automated/API/agent-traffic** stance in **Impact, CJ, Awin/ShareASale, PartnerStack** master ToS (search results were indirect — read the actual ToS).
- ⚠️ **Skimlinks/Sovrn** sub-affiliation terms: do they permit *our* re-distribution to agent "sub-publishers," and at what cut?
- ⚠️ **Cashback-affiliate approval** process + per-merchant incentivized-traffic bans for each best-5 program.
- ⚠️ Whether **agent-initiated signups** count as valid traffic per each merchant (some require human action).
- ⚠️ FTC: confirm the exact **clear+conspicuous** placement standard for an *agent-surfaced* recommendation (near the link, before the action).

---

## 9. Recommended build order

1. **Enroll** in the best-5 directly **+** open a Skimlinks/Sovrn account for breadth; get **cashback-affiliate approval**.
2. **Translation layer** (Sub-system A) — ingest → agent-native object → broker endpoint → S2S/coupon capture.
3. **Disclosure injector** — wire FTC affiliate + AI disclosures into the link/tutorial schema (compliance-first).
4. **`/conversion` receiver + kickback ledger.**
5. **FirstPromoter wrap** → Sub-system B mint API for direct-deal merchants.
6. **Agent identity / anti-Sybil** before turning on payouts.

---

## Sources
- Sub-affiliate networks: https://support.avantlink.com/hc/en-us/articles/8379889788827-Sub-Affiliate-Networks-Explained · https://www.skimlinks.com/ · https://intercom.geni.us/en/articles/2755546
- Incentivized/cashback + coupon policy: https://ui.awin.com/merchant-profile-terms/123676 · https://www.wildfire-corp.com/blog/ultimate-guide-cashback-rewards-programs · https://cusenware.com/blog/affiliate-marketing-cashback-model-explained/
- FTC disclosure (incl. sub-network chain + AI, 2026): https://www.affiversemedia.com/the-ftc-is-watching-ai-generated-endorsements-affiliate-links-and-what-compliance-looks-like-in-2026/ · https://www.auditsocials.com/blog/ftc-affiliate-disclosure-requirements-2026-guide
- Tracking methods (cookieless/S2S/coupon): https://irev.com/blog/cookieless-affiliate-tracking-what-actually-works-in-2026/ · https://tapfiliate.com/blog/affiliate-tracking-methods-gp/
- Network ToS / incentivized bans: https://deepclick.com/resources/blog/url-cloaking-affiliate-guide-2026/
