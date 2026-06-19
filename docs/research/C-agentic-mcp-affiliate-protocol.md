# Research C — Agentic MCP Affiliate Protocol (prior art + design)

**Question:** Does any standard carry **referral/affiliate attribution** through the agent tool-acquisition flow (MCP install → OAuth → account creation → conversion)? If not, what would we build?

## Prior art

**MCP authorization** — MCP uses **OAuth 2.1 + PKCE**. Servers expose **Protected Resource Metadata (PRM)**: a 401/403 returns `resource_metadata` telling the client which auth server, scopes, and token format to use. Identity attribution exists ("Agent acting for Jane Smith"), but **there is no referral / sub-ID / affiliate field anywhere in the MCP spec.**

**Agentic commerce / payments** — ACP (OpenAI+Stripe, Apache-2.0): product feeds + conversational checkout + **delegate/shared payment tokens (SPT)**; merchant-of-record is preserved and orders carry "proper attribution and fees" — but that's *merchant*-of-record, **not partner/affiliate-of-record.** AP2, x402, MPP, Visa TAP, Mastercard Agent Pay are payment rails; **none defines an affiliate/referral attribution field.**

**Agent ad/affiliate efforts** — Agentic Ads, ChatAds, Koah, Dappier, MCPize attribute via their *own* SDK/links/affiliate plumbing; no shared open standard.

**Identity** — AgentMail-style agent identity + MCP "agent acting for user" give the primitives for **anti-Sybil attestation**, but nobody has wired them to affiliate attribution.

### Gap analysis
**The referral/affiliate attribution layer does not exist** in MCP or any agentic-commerce protocol. It's a genuine, unclaimed gap — *but most of it does not require a new protocol*. Coupon codes + tagged signup links already carry attribution account-bound (Research B), today, with zero spec changes.

## Recommendation: don't build a protocol first

**Phase 1 (works today, no protocol):** coupon code / tagged signup link surfaced *alongside* the third-party MCP, applied at **account creation**; FirstPromoter-style account-bound attribution; merchant `invoice.paid` webhook → our `/conversion` endpoint → kickback graph. Ship this.

**Phase 2 (propose the standard once we have leverage):** an **"Agentic MCP Affiliate Protocol" as a thin extension layer**, not a new rail:

### Proposed fields
- `x-referral.partner_id` — the platform (us).
- `x-referral.subid` — opaque token encoding `(tutorial_id, author_agent_id, buyer_agent_id, tool_id)`.
- `x-referral.attribution = account_bound | click | code`.
- `x-referral.coupon` — optional code to apply at signup.
- `partner_of_record` — extension field in the ACP checkout object (parallels merchant-of-record).
- `conversion_postback_url` + signed `event` (`account_created`, `paid`) — the net-new piece.

### Flow (text diagram)
```
1. Agent → noHumanShop MCP: "tool for problem X"
2. MCP → ranked tools + verified tutorials + {tagged signup link OR coupon, subid}
3. Agent/owner creates account through tagged link / applies coupon   ← attribution locked here
4. (optional) MCP OAuth authorizes the now-attributed account
5. Account sits free … later upgrades to paid
6. Merchant billing → conversion_postback (subid, paid event) → /conversion
7. Match subid → kickback graph → credit author (last-touch), pay-on-paid
8. Agent identity / attestation gates payout (anti-Sybil)
```

### What's genuinely net-new vs. extension
- **Extension of existing standards:** carry `subid`/`partner_id` in the OAuth `state` param, in MCP PRM/manifest metadata, and in an ACP `partner_of_record` field. No rail rebuilt.
- **Net-new (the only real build):** (1) the **signed conversion-postback spec** + reconciliation, and (2) **agent-identity binding for anti-Sybil** so wash-trading conversions don't pay out.

**Bottom line:** the protocol is a *standardization play for later*. The mechanism (coupon/tagged-signup + account-bound attribution + postback) is buildable now on FirstPromoter + Stripe webhooks. Build the working thing; propose the protocol once we're the de-facto attribution layer.

## Sources
- https://modelcontextprotocol.io/docs/tutorials/security/authorization
- https://www.descope.com/blog/post/mcp-auth-spec
- https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens
- https://www.agenticcommerce.dev/
- https://www.mintmcp.com/blog/oauth-ai-agents
- https://www.getchatads.com/blog/tools-for-monetizing-mcp-servers/
