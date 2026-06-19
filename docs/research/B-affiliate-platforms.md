# Research B — Affiliate platforms for running our own program

**Question:** What platform lets us mint trackable affiliate links/coupon codes for merchants, with **account-bound (lifetime/recurring) attribution**, **programmatic API**, **Stripe `invoice.paid` webhooks** (delayed conversion), and ideally **multi-merchant** support?

**Critical distinction — we have two different needs:**
1. **Piggyback (be the affiliate):** join merchants' *existing* programs. No platform to run — we just enroll (PartnerStack market, Impact, in-house FirstPromoter/Rewardful programs). Covered in Research A.
2. **Run our own program / network (this doc):** merchants enroll *on us*, we generate the trackable codes/links and pay out. This is where we need a platform — or to build on Stripe.

## Comparison

| Platform | Best for | Account-bound recurring? | Programmatic API (links/codes) | Stripe + delayed `invoice.paid` | Coupon-code attribution | Multi-merchant / marketplace |
|---|---|---|---|---|---|---|
| **FirstPromoter** | SaaS subscriptions | ✅ recurring/lifetime | ✅ API; **spins up Stripe coupons in-app**, multiple codes/affiliate, self-generated codes, auto-tracked redemptions | ✅ native Stripe/Paddle/Chargebee/Recurly/Braintree | ✅ **strong** (built-in coupon engine) | ⚠️ single-merchant oriented |
| **Rewardful** | AI SaaS on Stripe | ✅ recurring/trials | ✅ API | ✅ Stripe-native, trials/recurring | ✅ supported | ⚠️ single-merchant |
| **Tolt** | Early-stage startups | ✅ | ⚠️ limited (verify) | ✅ Stripe/Paddle/Chargebee | ✅ | ⚠️ single-merchant |
| **PartnerStack** | Later-stage, multi-partner | ✅ | ✅ | ✅ | ✅ | ✅ **resellers/agencies/portals — closest to a network** |
| **Impact.com** | Networks/enterprise | ✅ | ✅ robust, sub-IDs, server postbacks | ✅ | ✅ | ✅ **true network/marketplace** |
| Tapfiliate / Refersion / LeadDyno / GrowSurf | General/ecom | varies | varies | varies | varies | mostly single-merchant |

## Recommendation

- **For coupon-code + API + recurring (account-bound), single-merchant deals → FirstPromoter.** It's the standout on our exact must-haves: it **mints Stripe coupon codes programmatically**, gives each affiliate multiple codes, tracks every redemption automatically, and binds to the subscription so delayed free→paid converts correctly. This is the engine for our **direct-merchant-deal** instrument ("use code `NOHUMAN`, you pay us for the life of the account").
- **For the multi-merchant / network dimension → Impact.com or PartnerStack.** A network where *many* merchants enroll under one roof and commissions split is Impact/PartnerStack territory, not the single-SaaS tools. PartnerStack also doubles as a *piggyback* source (many AI SaaS already run there).
- **Likely end state = hybrid:** piggyback via PartnerStack/Impact for breadth on day one, *plus* FirstPromoter (or a Stripe-Connect-based custom layer) for direct deals where we want account-bound coupon attribution and full margin.

## The build-vs-buy note
For our agent-mediated model the must-haves are **(1) coupon/account-bound attribution** (not cookies — agents don't carry sessions) and **(2) a programmatic API** (agents/automation mint and read). FirstPromoter satisfies both off-the-shelf, so **we likely don't build the attribution engine at first** — we wrap FirstPromoter's coupon API + its conversion webhooks, and add our own kickback-graph ledger on top. Build custom only if multi-merchant splitting + agent identity force it (see Research C).

## Sources
- https://firstpromoter.com/  /  https://help.firstpromoter.com/en/articles/9546784-how-to-automatically-generate-tracking-coupon-codes-in-stripe-using-firstpromoter
- https://firstpromoter.com/blog/comparing-top-affiliate-tracking-solutions-firstpromoter-vs-rewardful-vs-partnerstack-vs-leaddyno
- https://www.rewardful.com/articles/best-affiliate-software-for-ai-saas-companies
- https://affonso.io/blog/firstpromoter-alternatives
- https://afftank.com/blog/affiliate-networks-launch-ai-saas
