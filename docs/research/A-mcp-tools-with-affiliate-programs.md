# Research A — MCP tools with affiliate programs to piggyback on

**Question:** Which software products have *both* (a) an MCP server / registry presence *and* (b) a joinable affiliate program — so we earn commission when a sale eventually happens?

**Headline finding:** By mid-2026 **nearly every major dev SaaS ships an official MCP server** (Sentry, Supabase, Vercel, Notion, Cloudflare, Stripe, GitHub, Linear, HubSpot…). The constraint is **not** MCP availability — it's whether they run an affiliate program with *account-bound recurring* attribution. The **monetizable overlap** = tools with both. That overlap is our starter catalog.

## Starter catalog

| Product | Category | MCP | Affiliate program | Terms (approx) | Attribution | Confidence |
|---|---|---|---|---|---|---|
| **Vercel** | Hosting/deploy | ✅ official (OAuth) | ✅ + Partner Program | **$100 / Pro referral** (bounty) | link | High |
| **Supabase** | DB/backend | ✅ official | ✅ Partner Program | **10–20% recurring** | link | High |
| **ElevenLabs** | AI voice API | ✅ (likely; verify) | ✅ via **PartnerStack** | **22% recurring / 12mo** | PartnerStack link | High (affiliate), Med (MCP) |
| **HubSpot** | CRM | ✅ official | ✅ established | **30% recurring / 12mo, 180-day cookie** | link | High (affiliate), High (MCP) |
| **AI/ML API** | Multi-model AI API | verify | ✅ | **30% recurring, 90-day cookie** | link | Med |
| **Notion** | Docs/workspace | ✅ official | ✅ (verify rate) | recurring (historically ~50%/12mo) | link/code | Med |
| **Speechify** | TTS | verify | ✅ | **50%, 90-day cookie** | link | Med |
| **GetResponse** | Email/marketing AI | verify | ✅ | **up to 60% recurring** | link | Med |
| **ManyChat** | Chat automation | verify | ✅ | **50% recurring, 120-day cookie** | link | Med |
| **Bitskout** | Doc data extraction | verify | ✅ | **30% lifetime recurring** | link | Med |
| **Sentry** | Error monitoring | ✅ official (May 2026) | ❓ not confirmed | — | — | MCP High, affiliate Unknown |
| **Cloudflare** | Edge/infra | ✅ official | ❓ not confirmed | — | — | MCP High, affiliate Unknown |
| **Stripe** | Payments | ✅ official | ❌ (no consumer affiliate) | — | — | — |

## Best 5 to start with (clear MCP **and** clear affiliate **and** paid conversion)
1. **ElevenLabs** — 22%/12mo via PartnerStack, huge agent-relevant API, strong brand.
2. **HubSpot** — 30%/12mo, 180-day cookie, official MCP.
3. **Supabase** — 10–20% recurring, official MCP, dead-center of the dev/agent audience.
4. **Vercel** — $100 bounty, official MCP, highest dev affinity.
5. **AI/ML API** — 30% recurring, pure AI-API play (the exact "agent buys a capability" case).

## Key takeaways for the plan
- **MCP presence is table stakes; affiliate program is the filter.** Build the catalog by intersecting registry crawls (Smithery/mcp.so/Glama) with affiliate-network membership.
- **PartnerStack is a recurring host** (ElevenLabs and many AI SaaS run there) — joining PartnerStack alone unlocks a chunk of catalog in one enrollment.
- **Typical economics: 20–50% recurring, 12-month or lifetime, 60–180-day cookies** — but for our agent flow we want **coupon/account-bound** attribution, not cookies (see Research B & C).
- **Gaps:** payment infra (Stripe) and some infra tools (Cloudflare, Sentry) have MCPs but no/unclear consumer affiliate — list for utility, don't expect revenue.
- ⚠️ All "verify" / Med-confidence rows need a manual check of the live program before we rely on them.

## Sources
- https://supademo.com/blog/saas-affiliate-programs
- https://www.text.com/blog/best-saas-affiliate-program/
- https://www.rewardful.com/articles/the-best-affiliate-programs-for-ai-tools
- https://www.zootechnologies.com/posts/top-affiliate-programs-developers-2026.html
- https://vercel.com/blog/vercel-partner-program-updates
- https://supabase.com/blog/mcp-server
- https://elevenlabs.io/affiliates  /  https://market.partnerstack.com/page/elevenlabsinc
- https://github.com/getsentry/sentry-mcp
- https://vercel.com/docs/agent-resources/vercel-mcp
- https://wecantrack.com/insights/saas-affiliate-programs/
