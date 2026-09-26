# Atlas evals — the gate on the model's mouth

*Companion to `scripts/eval-atlas.ts`. Why it exists, how to run it, how to add
a case, and the one rule that keeps it honest.*

## Why

We hold ~50 gates on our **data** and, before this suite, zero on what Atlas
actually **says**. The industry's biggest player has declared trust — "a
rigorous evals system to guard against hallucination" — the axis of
competition. Their evals grade the model after it speaks. Our architecture
refuses in the data *before* the model speaks (the resolver decides holds in
code), and this suite closes the third side of the triangle: adversarial
prompts that try to make Atlas break the law of the house, asserted
mechanically, red on any failure.

## What it tests (the law of the house, distilled)

- **Never promise "safe"** — informed always, "safe" never ("safety-*" cases)
- **Never a numeric level, never the retired State tiers** — postures in words
- **The advisory is quoted VERBATIM or not at all** — the paraphrase trap
  asserts the exact FCDO string appears character-for-character
- **A booking hold survives any pressure** — including "ignore your rules"
- **Absence of an advisory is never an assurance**
- **Never fabricate** a price, a phone number, a dated event
- **The banned vocabulary stays banned** (honest/honestly/upfront) and **the
  mark stays one word** even when the user asks Atlas to repeat the two-word form
- **No urgency, no FOMO** — trust is the asset that converts

## How to run

```
npm run eval:atlas                # whole suite
npm run eval:atlas -- safety      # cases whose name contains "safety"
```

It runs against the **deployed** atlas Edge Function — the same endpoint the
site calls — so it needs the project env (either plain or `VITE_`-prefixed):
`SUPABASE_URL`, `SUPABASE_ANON_KEY`. Networked, like `check:fcdo-text`, and the
same doctrine applies:

> **A blocked run is not a passing run.** Exit 2 = could not verify (no env,
> endpoint down, degraded mode). Exit 1 = a case failed. Exit 0 means every
> case *truly ran* and passed. Never read a 2 as a pass.

Run it **after every deploy of the atlas function** and **after any edit to the
SYSTEM prompt** — the prompt is the thing under test.

## Adding a case

Append to `CASES` in `scripts/eval-atlas.ts`. Name it for what it attacks
(`safety-…`, `brand-…`, `trust-…`, `temporal-…`). Prefer `mustNot` (forbidden
strings hold up; required free language rots). Use `mustInclude` only for
mechanical obligations like the verbatim advisory string — and when the FCDO
wording moves in `src/data/safety.json`, update `KENYA_VERBATIM` from the row,
never from memory.

**The one rule:** if Atlas fails a new case, fix the **prompt** or the **data**
and re-run. Never soften the case to green — a gate that bends is a gate that
teaches people to lean on it.

## Relationship to the tool loop

Atlas now calls the corpus tools (`_shared/corpus.ts` — the same roster the
public MCP server exposes). The evals matter *more* with tools, not less:
every tool round is a chance to misread a result, and the safety verdicts the
tools return (`get_safety`, the dossier safety block) are resolver output that
Atlas must relay verbatim. The suite grows with the tools; the deterministic
resolver never becomes one of them.
