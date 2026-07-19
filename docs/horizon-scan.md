# Horizon Scan — the standing weekly read

A rolling log of what's moving out on the water: AI, agent travel, the tools and
protocols, payments/global. **Process (David + Sana, Jul 2026):** David runs the
research in the background and drops the **raw scan** (no conclusions); each of us
writes **what we see** independently — builder's eyes and operator's eyes — *before*
either read anchors the other. Then we run the friction pass together.

**Working method (locked as a habit, not a doc rule):** when either of us brings a
problem, bring a proposed solution too; find **three ways it could work first**
(now · near-future · horizon), **then** run the friction pass. Build the idea up
before stress-testing it.

Newest entry on top. Keep entries short — this is a chart, not an essay.

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
