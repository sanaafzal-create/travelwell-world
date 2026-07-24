# Horizon Scan — the standing weekly read

A rolling log of what's moving out on the water: AI, agent travel, the tools and
protocols, payments/global. **The deal (David + Sana, locked Jul 2026): both of us
scan every week, from our own directions** — David the **market side** (partnerships,
hosts/consortia, money, momentum), Sana the **build side** (code, dev docs, dev
forums, and the Duffel/Stripe/Sabre/voice changelogs). Each writes **what they see**
independently — builder's eyes and operator's eyes — *before* either read anchors the
other. Then we compare, run the friction pass, and answer one question: **what did we
do this week to get more fully on the train?** No "we're not that far behind" — we
scan the source, not the news three weeks late.

**Working method (locked as a habit, not a doc rule):** when either of us brings a
problem, bring a proposed solution too; find **three ways it could work first**
(now · near-future · horizon), **then** run the friction pass. Build the idea up
before stress-testing it.

Newest entry on top. Keep entries short — this is a chart, not an essay.

---

## Standing sources (subscribe once, feed the weekly scan)
Providers tell us when they ship, so we stop learning three weeks late:
- **Duffel** — API changelog + status page + our account-manager updates (MCP server: agent-readiness live).
- **Stripe** — API changelog / release notes; UCP developments (Stripe backs UCP).
- **Sabre** — Dev Studio account, its API release notes, and the **account-manager email distribution list** (their onboarding checklist names this as the way to stay informed).
- **Voice stack** — LiveKit, Deepgram, Cartesia changelogs (the swappable slots).
- The **launch changelog-watcher** (status-and-launch-plan) is the automated successor to this manual list — narrow to the 8–12 public-API providers first.

## Week of 2026-07-23 — the agentic wave (David's deep scan)

**Raw scan (David):**
1. **Sabre** launched agentic APIs built for AI agents, via an industry-first **MCP server** ("universal translator" for any AI agent). Reach: 420+ airlines, 2M+ hotels. Open developer access framed as *core strategy, modular, no all-or-nothing lock-in* — our exact adapter-seam principle, mirrored back by the biggest agent-native GDS.
2. **Amadeus** bought AI-native booking-orchestration startup **SkyLink** (Feb 2026); positioning as the "translation layer for the AI era."
3. **Sabre + PayPal + MindTrip** launching an end-to-end agentic booking pipeline this quarter (conversational planning + live inventory + integrated payment in one flow).
4. **Duffel** (we're signed) has an **MCP server** too — so Atlas → Duffel agent-readiness is real now, and Duffel handles PCI (fits Version-1 payments exactly). We're already on the leading rail.

**What Sana sees (builder's read):**
- **We're more in-the-stream than it feels — and ahead on the part that's hardest to fake.** Our own **read-only MCP server is LIVE** (agents can read TravelWell today). Most of the 89% can't say that. Sabre's "modular, no lock-in" is validation, not a threat — it's the architecture we already committed to.
- **Two MCP directions, don't conflate them:** (a) *inbound* — agents read us (our MCP server, done); (b) *outbound* — Atlas reads/books via Duffel's/Sabre's MCP (a client we build). Both matter; (a) is our moat, (b) is the booking build.
- **Atlas booking through Duffel** = search is nearly there (the `flights` seam is built; needs the sandbox token) → **but the Duffel sandbox is still OFF** (account activation incomplete — the real current blocker). Order/booking is a bounded build on top, demoable in sandbox (fake money, real test tickets); full go-live stays gated on Services Agreement + KYC + US-seller terms.
- **Grab now (free/early):** Sabre Dev Studio sandbox + its distribution list; finish Duffel activation to unlock its MCP; get on every provider changelog. Being agent-readable early is the free land-grab — and we already started it.

**Decisions/actions:** register Sabre Dev Studio this week (evaluation → "Duffel+Stripe signed, Sabre in evaluation" for VCs); finish Duffel account activation (unblocks the whole flight flow); subscribe the standing sources above.

**Sabre MCP Server — hands-on eval (2026-07-24, from the beta doc):**
- **It's a real, managed remote MCP server** — not REST-with-a-label. OAuth2 auth, an **MCP URL** you add to any MCP-compatible client (Cursor/VS Code — so Atlas too), exposing Sabre workflows as AI-native tools: **flight shop & book, hotel shop & book, post-booking servicing, fare-rule decode.** Architecture: User↔AI Agent↔(tools)↔MCP↔Sabre. **Validates our architecture** — the biggest GDS is building the exact MCP-tools shape we committed to.
- **But heavily gated — NOT self-service (the key nuance):** private beta ("work in progress"); requires a **valid CERT PCC/EPR** (a Sabre *agency* credential — you must be an existing Sabre partner/customer); a **Trusted-Client allowlist**; **~7-day activation**; runs in Sabre's isolated CERT env. We hold none of that today.
- **Verdict:** Sabre MCP is a **post-credentialing move** — it rides the same agency-credentialing track as CLIA/IATAN (David's own note said production booking does). **Duffel stays the near-term rail** (self-service, already signed, PCI/MoR fits Version 1). Sabre is broader (flights+hotels+servicing in one) → revisit when we hold a PCC. The free REST "Try it out" APIs (Flight Search/Shop) are pokeable in the PLAY/CERT sandbox now without the MCP gate, for data-quality feel.
- **Next:** click "Request Access to the MCP Server" to enter the queue; keep it in evaluation for the VC line. Pricing = the one unknown (FAQ not expanded in the capture).

---

## Week of 2026-07-19

**Raw scan (David):**
1. Industry crossed the agentic line in the last ~90 days. Sabre/PayPal/Mindtrip shipped an end-to-end agentic booking pipeline this spring. Google named hotels the next vertical for its Universal Commerce Protocol. As of **June 2026, only 11% of travel companies can complete a booking through an AI agent in real time** — the other 89% are built for the human era.
2. Protocols have settled: **MCP** = agent-access standard; **A2A** = agent-to-agent link; **UCP** (Google/Shopify; backed by Amazon, Microsoft, Meta, Stripe, Salesforce) = commerce/checkout layer.
3. Recurring theme across sources: winners won't be the loudest platforms — the ones with the **cleanest, most trusted, most interoperable data**. "AI will reward the clearest data, not the loudest platform."
4. Payments/global: Stripe covers 135+ currencies, positioning as the AI-commerce rail. **Airwallex** runs multi-currency treasury at **0.5% FX** (half Stripe's ~1%), pays out to 200+ countries, free to open on the US plan.

**What Sana sees (builder's read):** _[in the reply thread 2026-07-19 — fold the durable points here once we align, per David's "both reads before either decides."]_
- Headline: the "clearest data wins" thesis is the bet we already placed (structured dossiers, controlled vocab, buffet block, llms.txt + JSON-LD). We're on the cheap side of the 89/11 line by accident of that discipline.
- Cheapest highest-leverage next move: **read-only MCP server on the existing corpus** (~25–40h — wrapping clean data we already serve, not building data).
- The two reefs: (1) the **SSG rendering blocker** still gates the broad "be citable/reachable" payoff; (2) the agentic-checkout excitement makes **merchant-of-record** easy to drift into via the payment/UCP/treasury stack — guard it (see payments canon).

**Decisions parked for the joint call:** MCP hours + go/no-go · A2A sequencing · UCP-via-Stripe · the Stripe→Airwallex treasury shape (scoped to commission/FX vs gross spend). Lock into canon once aligned — not before.
