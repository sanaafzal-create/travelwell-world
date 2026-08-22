# The daily advisory checker

*David's safety verification cycle, built. Sana, 2026-08-11.*

**One checker. Runs daily. Surfaces any move — in either direction — the same
day, and publishes fortnightly.**

That's the one design decision worth restating, because it isn't what the spec
originally asked for. A fortnightly sweep with a separate urgent path doubles the
failure surface, and the half that fails is the half you need. So the checker runs
every day and the 1st and the 15th become **what we publish, not what we check**.

---

## The two rules, and where they live in the code

**Freeze on failure.** `advisory_state` is written **only** on a successful read
— the upsert is the last statement in the success path and nothing else touches
that table. A source we couldn't reach today keeps its previous value *and its
previous `fetched_at`*, so the staleness is visible rather than papered over. A
country we couldn't read is not a country with no advisory.

**The audit trail.** Every run writes to `advisory_runs`, including the runs
where nothing changed — the quiet ones are what let you prove a gap was a quiet
period and not an outage. Every detected change writes to `advisory_changes` with
what it was, what it became, and when we noticed.

**Nothing publishes itself.** A change lands as `pending`. The site keeps showing
the last confirmed value until a human confirms it. That's deliberate: an
automated pipeline that can silently change a safety level is a worse risk than a
stale one, because nobody is watching it.

## The pieces

| Piece | What it is |
|---|---|
| `supabase/migrations/0013_advisory_state.sql` | Three tables: current state, the change queue, the run log |
| `supabase/migrations/0014_advisory_same_day.sql` | Adds `same_day` — both directions surface together |
| `supabase/migrations/0015_advisory_schedule.sql` | The daily 06:00 UTC job — **generated**, don't hand-edit |
| `supabase/functions/advisory-check/index.ts` | The checker itself |
| `docs/advisory-countries.json` | The country list it's called with — **generated** |
| `npm run gen:advisory-payload` | Regenerates that list *and* 0015, from the live catalog, in one command |

## Sources — structured endpoints, never scraping

**The FCDO is PRIMARY (David, 2026-08-13).** It is the source we can actually
read — 36 of 36 countries, no failures, every run since the checker went live —
and it carries the regional carve-outs that no other source publishes.

**Primary does not mean it supplies levels, and this is the part not to gloss.**
The FCDO publishes no numeric level at all. Our L1–L4 values remain the curated
baseline in `safety.json`, sourced from State. So while State is unreachable the
checker detects **change** but cannot detect a **level move** from the source
that numbers them. That is a real gap. It is why State access is worth chasing,
and it should not be softened into "we have it covered."

- **UK FCDO — primary**, via the GOV.UK Content API:
  `www.gov.uk/api/content/foreign-travel-advice/<slug>` — one request per
  country. No numeric level; the **regional** detail is the signal.
- **US State — enrichment**, Consular Affairs API:
  `cadataapi.state.gov/api/TravelAdvisories` — one request for every country.
  Still tried every run, so the day access is granted it starts working with no
  deploy. Falls back to the RSS feed (`travel.state.gov/_res/rss/TAs.xml`).
- **CDC** health notices — the layer that moves fastest, and the next one to wire.

**A blocked source is `degraded`, not 36 failures.** State's outage used to add
`countries.length` to `failed`, so a healthy run read like a catastrophic one —
which teaches everyone to ignore the number, and then the real failure goes
unnoticed too. Unreadable sources are now named in `notes.degraded` and in the
response body. "36 failures" and "one source is down" look identical in a count
and mean completely different things.

Both sources bot-block a bare request, so the function sends browser-like
headers. That's a small durable fix applied to a structured endpoint, rather than
buying time against a page that can be redesigned out from under us.

## Setting it up

**1 · Apply the migrations.** Paste `0013_advisory_state.sql`, then
`0014_advisory_same_day.sql`, into the Supabase SQL editor.

**2 · Deploy the function.** `supabase functions deploy advisory-check`, or paste
it in the dashboard editor (it's a single self-contained file, like `atlas`).
Note it's an **Edge Function**, not SQL — the code editor under Edge Functions →
advisory-check, never the SQL editor.

**3 · Enable `pg_cron` and `pg_net`.** Dashboard → Database → Extensions. Both,
once. (Migration 0015 checks for them and refuses to schedule anything without
them, rather than leaving a job that can't run.)

**4 · Put the service-role key in Vault.** `cron.schedule` stores its command as
plain text in `cron.job`, readable by anyone with database access — so a key
pasted into a job is a key sitting in a table forever, and it would be in the git
repo besides. Vault holds it encrypted and the job asks for it at run time. One
statement, in the SQL editor, and the key goes nowhere else — not into a file,
not into an email, not into a chat:

```sql
select vault.create_secret('<service-role-key>', 'advisory_check_key',
                           'Service-role key used by the daily advisory checker');
```

The name must be exactly `advisory_check_key` — that's what the job looks up.

**5 · Apply `0015_advisory_schedule.sql`.** Paste it into the SQL editor. That
schedules the job at **06:00 UTC daily** with the country list already inlined.

06:00 UTC is deliberate: the FCDO publishes on London business hours, so an
early-UTC run reads yesterday's settled state rather than catching a page
mid-edit, and anything it queues is waiting when someone opens the laptop.

**0015 is generated, not hand-written** — `npm run gen:advisory-payload` writes
`docs/advisory-countries.json` *and* the migration in one command. That is the
whole point: the payload the job actually sends and the payload in the repo have
to be the same bytes. **Regenerate whenever a destination adds a country, then
re-apply 0015** — it unschedules the old job before scheduling the new one, so
re-applying is the correct and only step. If the list and the job drift, the
checker silently stops covering that country while still reporting a successful
run — the worst shape a failure can take, because the number at the end still
looks right.

`timeout_milliseconds` is set to 120s in the job, and it's worth knowing why even
though it can't break a run. `net.http_post` is asynchronous — it hands back a
request id immediately and the cron job reports success either way, so a timeout
doesn't stop the checker; the function keeps running server-side and still writes
its tables. What pg_net's 5-second default costs you is the **response**:
`net._http_response` records a timeout instead of the run summary, and the first
place you'd look after a bad morning shows an error that didn't happen.

**6 · Prove it's actually scheduled.** A cron job that was never registered looks
identical to a quiet week, and `advisory_runs` can't tell you the difference —
it only records runs that happened.

```sql
-- The job exists and is active
select jobid, schedule, active from cron.job where jobname = 'advisory-check-daily';

-- It fired, and pg_net didn't fail before the function was reached
select status, return_message, start_time from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'advisory-check-daily')
order by start_time desc limit 5;
```

`status = 'succeeded'` here means *the HTTP call was dispatched*, not that the
checker read anything — that answer is in `advisory_runs`, and the two are worth
reading together the first morning after scheduling.

Rather than wait until 06:00 to find out, fire the job's own command once by
hand. It reads `cron.job` rather than repeating the SQL, so what runs now is the
same bytes as what runs tomorrow — a hand-typed "test" that differs from the real
job proves the wrong thing:

```sql
do $$
declare cmd text;
begin
  select command into cmd from cron.job where jobname = 'advisory-check-daily';
  if cmd is null then raise exception 'No job named advisory-check-daily — 0015 was not applied.'; end if;
  execute cmd;
end $$;
```

Then read `advisory_runs` — a new row with `checked = 36` means the loop closed.

**If the response is a 400**, the request reached the function (the gateway let it
through and our own code answered) but the country list didn't arrive with it.
The 400 body carries a `diagnostic` block naming which of the three ways it went
wrong — no body at all, a body that wasn't JSON, or valid JSON without a
`countries` key — because at 06:00 those read identically and each has a
different fix. Two things to check first:

```sql
-- Is the stored job command intact, and does it still carry the payload?
select length(command) as chars, position('countries' in command) as has_payload
from cron.job where jobname = 'advisory-check-daily';

-- Does a minimal body get through? Isolates the mechanism from the payload.
select net.http_post(
  url     := 'https://xgjidkgctqqdprxtxeui.supabase.co/functions/v1/advisory-check',
  headers := jsonb_build_object('Content-Type', 'application/json',
               'Authorization', 'Bearer ' || (select decrypted_secret
                 from vault.decrypted_secrets where name = 'advisory_check_key')),
  body    := '{"countries":[{"iso":"KE","name":"Kenya","match":["kenya"],"fcdo_slug":"kenya"}]}'::jsonb,
  timeout_milliseconds := 60000);
```

A 400 rejection deliberately writes **no** `advisory_runs` row. A rejected call
never checked anything, and a row reading `checked: 0` is indistinguishable from
a real run that found nothing — the exact ambiguity the audit trail exists to
remove.

### The one that cost us an afternoon: a newline in the Vault secret

The first scheduled run came back 400, and the diagnostic showed the function had
received this as its **body**:

```
User-Agent: pg_net/0.20.3\r\nContent-Length: 89\r\n\r\n{"countries": [...
```

Two of pg_net's own headers, inside the body. That has exactly one cause: the
HTTP header section was terminated early, so everything written after it became
payload. The terminator is a blank line — and a key copied with a trailing line
break produces one. The header value ends in a newline, pg_net appends its own
CRLF, and those two form the empty line that ends the headers. Every header
pg_net writes next, and then the JSON, land in the body.

**Nothing about the symptom points at the key.** It reads as a malformed payload,
so you go looking at the payload, the dollar-quoting, the size of the job command
— all of which are fine.

The fix is in the job permanently: the Authorization value is built with
`trim(both E' \t\r\n' from decrypted_secret)`, and 0015's guard now refuses to
schedule if the stored secret has whitespace *inside* it (which is a corrupted
paste, not a key). To check a stored secret without printing it:

```sql
select name,
       length(decrypted_secret)                                as len,
       length(trim(both E' \t\r\n' from decrypted_secret))     as trimmed_len,
       decrypted_secret ~ '\s'                                 as has_whitespace
from vault.decrypted_secrets where name = 'advisory_check_key';
```

`len` above `trimmed_len` is the newline. To clean it in place, still without
printing it:

```sql
select vault.update_secret(
  (select id from vault.secrets where name = 'advisory_check_key'),
  (select trim(both E' \t\r\n' from decrypted_secret)
   from vault.decrypted_secrets where name = 'advisory_check_key'));
```

**The general lesson, worth carrying to any other job we schedule this way:** a
secret read from storage and concatenated into a header is an injection point for
whatever whitespace came along with it. Trim at the point of use, not at the point
of entry — you don't control how it got in.

## Reading the results

```sql
-- What needs a human TODAY — both directions
select country_iso, source, severity, from_level, to_level, detected_at
from public.advisory_changes
where status = 'pending' and same_day order by detected_at desc;

-- Everything pending, including the routine text changes
select * from public.advisory_changes where status = 'pending' order by detected_at desc;

-- Did it run, and did anything fail?
select started_at, checked, ok, failed, changed, notes from public.advisory_runs
order by started_at desc limit 14;

-- Anything we haven't successfully re-read in over a fortnight (the freeze rule
-- makes stale visible — this is the query that surfaces it)
select country_iso, source, level, fetched_at from public.advisory_state
where fetched_at < now() - interval '15 days' order by fetched_at;
```

Confirming a change is a human act:

```sql
update public.advisory_changes
set status = 'confirmed', confirmed_by = 'sana', confirmed_at = now(), note = 'checked against the source'
where id = <id>;
```

## Severities — and why none of them wait

**Both directions are same-day (David, 2026-08-11).** The checker originally held
de-escalations for the fortnightly publish. That was wrong: Uganda dropping from
Level 4 to Level 3 turns four gorilla-trekking destinations from never-bookable
into bookable, and sitting on that for two weeks is being wrong in the direction
that merely *sounds* careful.

The label survives; it just no longer decides the timing.

| Severity | Means | Same-day? |
|---|---|---|
| `escalation` | The level went **up** | **Yes** — and an alert can shout louder for these |
| `de-escalation` | The level went **down** | **Yes.** Oman went ordered → authorized departure and stayed Level 3 — materially different, invisible to any content refresh |
| `new` | A country we had no reading for | **Yes** — confirm before it shows |
| `withdrawn` | The source dropped it | **Yes** — confirm before removing anything |
| `text` | Same level, changed wording | **Depends on the source** — see below |

**The `text` case is the one worth understanding.** On a source that publishes
numbers, a text-only change means the number did *not* move — genuinely lower
urgency. But **the FCDO publishes no numeric level at all**, so for it the text
*is* the signal: its regional exclusions, which is where named-zone carve-outs
come from, move here and nowhere else. Treating text as routine would have
silently demoted our only currently-working source to background noise.

So `text` is same-day for the FCDO and routine for State.

The judgement is stored on the row (`same_day`) at detection time rather than
re-derived when read, so the audit trail records what we decided when we saw it —
not what today's code would decide. Same discipline as freezing on failure.

## Deep-link verification (2026-08-13) — 72 of 108 proven, zero 404s

First clean run of `npm run check:advisory-links`, from a laptop rather than the
build sandbox.

| Source | Deep links | Result |
|---|---|---|
| **UK FCDO** | 36 | **all resolve** |
| **US CDC** | 36 | **all resolve** |
| **US State** | 36 | 403 — blocked to automation, slug unproven |
| | | **0 404s among everything reached** |

**The FCDO and CDC slug tables are verified.** Every one lands on the right
country page, which is what §7B asks for.

## Re-run (2026-08-20) — 78 of 117 proven, and the 39 is really a 1

Same command, same shape of machine (Sana's laptop, residential egress), against
the grown link table: **117 deep links, 78 reached, 0 404s, 39 blocked — every
blocked one `state`.** Exit 3.

| Source | Deep links | Result |
|---|---|---|
| **UK FCDO** | 39 | **all resolve** |
| **US CDC** | 39 | **all resolve** |
| **US State** | 39 | 403 — website bot protection |
| | | **0 404s among everything reached** |

This **confirms** the existing matrix cell rather than adding a surprise:
`travel.state.gov` HTML pages 403 to automation from a residential IP with a full
Chrome User-Agent, exactly as recorded from the two earlier origins. Three
origins now agree. **It is the website's bot protection, and it is not the thing
the API cell is about** — `cadataapi.state.gov` (the machine-readable endpoint)
and `travel.state.gov` (the human website) are different hosts with different
answers, and conflating them is how this gets re-diagnosed a fourth time.

### 39 unproven links, 1 unproven slug

The headline count overstated the risk by 38×, and finding that out changed what
the checker prints.

**38 of the 39 blocked State URLs came verbatim out of State's own Atom feed**
(`statePublishedUrl()` in `advisory-sources.ts`). Exactly one — **Austria** — is a
slug our own rule derived, because Austria has no entry in the feed snapshot.

The only defect this checker can catch is *our slug pointing at the wrong page*.
A URL the source itself published cannot be our slug being wrong. So a 403 on an
attested URL and a 403 on a derived one are the same HTTP status carrying
completely different risk, and the run now counts them apart:

```
of the 39 unreached — source-published URL: 38   our derived slug: 1
```

**Exit codes** (`scripts/check-advisory-links.ts`):

| code | meaning |
|---|---|
| 0 | every deep link reached, none 404. Real pass. |
| 1 | a link 404s — a wrong slug. Fix `SLUG_OVERRIDES`. |
| 2 | **nothing** was reached. Not a pass; "no 404s" is trivially true. |
| 3 | partial, **and at least one of OUR derived slugs is unproven**. |
| 4 | partial, but every unreached link is the source's own published URL — no slug of ours left unchecked. Liveness still unconfirmed. |

Code 4 exists because the alternative was a check that can never go green from
the machine anyone actually runs it on, and that is a check people stop running.
It is deliberately not a 0: an attested URL that we could not fetch is still an
unfetched URL.

**The remaining work is one link, not thirty-nine**: prove
`austria-travel-advisory.html` from an egress State's website will answer, or get
Austria into the feed snapshot.

### Re-run 2026-08-20 (evening) — the GET hypothesis is FALSIFIED

Same laptop, same residential egress, after the retry landed. **78 of 117 proven,
39 blocked, 0 404s** — and the line that settles it:

```
38 refused GET as well as HEAD — the block is not the HTTP method.
```

So the CDN-rejects-HEAD theory is dead. `travel.state.gov` refuses this client
whichever verb it uses, from an origin that is *not* a datacenter. Combined with
the byte-identical results across three header profiles on the catalog host, two
variables are now eliminated for State's website: **not the method, not the
headers.** What remains is the client itself (a real browser passes; a fetch does
not) or an allow-list we are not on.

Recorded as a closed line of work. Do not retry a third verb, a fourth header
profile, or a redirect setting — each would be a one-variable change against a
question where two variables are already ruled out and the remaining one is not
addressable from our side.

**Exit 3, and correctly**: Austria is the single derived slug still unproven, and
exit 3 exists precisely to say "one of ours is unknown" rather than folding it in
with 38 attested URLs.

**Austria closed, by hand — 2026-08-20, Sana, browser.** The URL
`…/austria-travel-advisory.html` opens the Austria travel advisory page. That was
the last unproven derived slug of the original 39, and a person opening it is not
a workaround: the script is refused by method and by headers from a residential
IP, a real browser is what passes, so the human read is the *only* measurement
available and a better one than the script could make.

Recorded in `MANUALLY_VERIFIED` in the checker with who, when and how, and printed
on every run rather than silently subtracted — a slug can change under a manual
tick exactly as under an automated one, and an entry that has aged should be
visible. It is deliberately **not** added to the proven count: it was not proven
by that run.

### Coverage: the link checker had the same loop as the daily one

It iterated `COUNTRY_ISO` — 39 countries, 117 links — while the site emits
advisory links for **83** countries, one per country a destination sits in. So 45
countries and roughly 135 traveller-facing links were never checked, Mexico's 54
destinations among them.

Widened 2026-08-20 to the union of both sets. This one was fixable where the daily
checker's version is not: `advisoryLinks` derives FCDO and CDC slugs from the
country NAME and joins State's feed on the name too, so a country with no ISO code
still produces checkable links. No country-code map is required, which is exactly
what makes widening safe here and unsafe there.

Expect the next run to report ~252 links rather than 117, and expect some 404s
among the newly-covered derived slugs — that is the point of covering them.

### The 403 retry is a hypothesis, not a fix

The checker now retries GET when HEAD returns 403, because CDN bot rules often
reject HEAD while serving GET to the same client. **This has not been observed
working** — the build sandbox cannot reach State — so it is written to report its
own failure: a link refused both ways prints `403 (GET too)`, which is a new
matrix cell, not a reason to start tuning headers. One variable at a time; do not
stack a second change on this one before it has a result.

### The State API — the measured matrix, after three wrong readings

This question got answered wrong three times in two days, each time from a single
measurement. Here is the whole grid instead. **Do not re-diagnose this from one
data point; add a cell.**

`cadataapi.state.gov/api/TravelAdvisories`, response size:

| | curl-style UA | browser UA |
|---|---|---|
| **Laptop** (residential IP) | 200, `[]` | **200, 952 KB ✓** |
| **Edge Function** (datacenter IP) | 200, `[]` | 200, `[]` |

*Laptop cells measured 2026-08-13; Edge Function cells 2026-08-11, all three
header profiles in one run. The Edge Function's "browser-like" profile sends a
full Chrome 126 User-Agent — not a token gesture.*

**One cell works.** Both factors matter: a script-shaped User-Agent gets an empty
array even from a residential IP, and a full browser User-Agent gets an empty
array from a datacenter IP. **The origin is the constraint we cannot change from
Supabase**, so no amount of header tuning in the Edge Function will fix it. That
line of work is closed.

The other two State surfaces are simpler: `travel.state.gov` HTML pages 403 to
automation from **both** origins (bot protection on the website — a browser is
fine, which is what it is defending), and the RSS feed returns 343 bytes with
zero items to both.

**A third origin, added 2026-08-17 — and it measures nothing about State.**

| origin | `cadataapi.state.gov` | `cadatacatalog.state.gov` | `travel.state.gov` |
|---|---|---|---|
| **Build sandbox** (agent proxy) | `curl (56)` CONNECT tunnel failed, 403 | same | same |

Command: `curl -A '<full Chrome 128 UA>' -m 25 <url>`, 2026-08-17, all three hosts
in one run.

**That 403 is OUR proxy refusing to open the tunnel, not State refusing us.** The
request never left the network — no TCP connection to State was made, so there is
no State response to interpret. This cell belongs in the grid so nobody
re-measures it and reports "State blocks us everywhere," which is exactly the
shape of wrong reading #2: a result that looks like a data point about the origin
when it is a data point about the client.

It has one real consequence, which is why it is recorded: **`cadatacatalog.state.gov`
cannot be tested from here at all.** Whether the catalog's dataset files are
fetchable from a *datacenter* IP was an open cell — a different host from the API,
possibly static-file infrastructure with no bot protection, which would have made
it the daily route we need. Filling it needed a fetch from the Edge Function, not
from a laptop: a laptop success proves only the cell we already have.

**Filled 2026-08-20 — 403 to all three header profiles, byte-identical.** The
measurement and what it does and does not prove are below, under *"The cell is
filled"*. Short version: not the daily route, and headers are not the variable.

**The cell is filled — 2026-08-20. `cadatacatalog.state.gov` 403s the Edge
Function, and the header profile makes no difference whatsoever.**

`?probe=state-catalog`, run from the deployed function (datacenter IP), both
datasets × all three header profiles in one pass:

| dataset | curl-like | minimal | browser-like |
|---|---|---|---|
| `traveladvisory` | 403, 5497 B HTML | 403, 5497 B HTML | 403, 5497 B HTML |
| `geopoliticalarea` | 403, 5497 B HTML | 403, 5497 B HTML | 403, 5497 B HTML |

*Six attempts, `content-type: text/html`, **byte-identical** at 5497 in every
cell; 347 ms on the first and ~103 ms on the rest. The body is an edge block
page — IE conditional comments and `class="no-js ie6 oldie"`, the shape a CDN
serves, not an application.*

**What this settles.** The catalog host is not the daily route. The hope recorded
above — that it might be plain static-file infrastructure with no bot protection —
is dead, and it turns out to be *more* defended than the API, not less: the API
answers 200 with `[]`, the catalog refuses at the edge. Different failure mode,
and the harder one.

**What it also settles, and this is the cleaner finding: headers are not the
variable here.** Three profiles, from `curl/8.7.1` to a full Chrome UA, produced
responses identical to the byte. That is as decisive as this kind of measurement
gets — whatever is refusing us is not reading the User-Agent. Header tuning is
closed for this host on its own evidence, not by analogy to the API.

### What it does NOT settle — and the one measurement that would

It is tempting to read "403 from a datacenter IP" as the API's egress finding
again. **It is not, yet.** Two hypotheses survive this run:

1. **Egress** — the datacenter IP is refused, and a residential one is not.
2. **Client** — the host demands a real browser (JS challenge, TLS fingerprint),
   and *no* server-side fetch passes from anywhere, including a laptop.

The 12 August laptop download can't choose between them: that was a **real
browser**, which differs from the Edge Function in **both** ways at once. Reading
it as proof of the egress theory would be wrong reading #2 exactly — a
two-variable measurement used to settle a one-variable question.

**The discriminator is one command, from Sana's laptop:**

```bash
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' \
  -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' \
  https://cadatacatalog.state.gov/download/traveladvisory
```

Residential IP held constant, client changed from browser to fetch — one
variable. **`403 5497`** means the block is the client and no egress work can fix
it. **`200` with a large body** means the block is the egress, and a proxy or a
registered key would work. Until that runs, "it's the egress" is a hypothesis
about this host, not a finding — record it as one.

The probe now also captures `server`, `cf-ray`, `cf-mitigated` and `retry-after`
on each attempt, so a re-run names the intermediary and its rule instead of us
inferring a CDN from the shape of its HTML.

**Neither answer changes the plan.** FCDO stays primary, State stays enrichment
from the stored feed snapshot, and the recorded remediations are unchanged:
request API access, or route through a non-datacenter egress — with the caveat
that hypothesis 2, if true, means the second one does nothing for *this* host.

**The three wrong readings, on the record, because the method matters more than
the answer:**

1. *"It's the egress"* — right by luck, on a 682KB measurement whose command was
   never recorded.
2. *"It returns `[]` to everyone, the egress theory is dead"* — from a laptop
   curl with no UA flag. The command was mine and I had not controlled for the
   variable I was testing.
3. The truth is both, and it took a 2×2 to see it.

**A measurement whose provenance is not recorded is not evidence**, and neither
is one that changes two variables at once. Reading 2 was as unsound as reading 1
even though it contradicted it.

**Consequences, which survive all of this:** FCDO-primary stands on its own
evidence (36 of 36, every run) and never depended on this. Requesting API access
is still right. And if we ever want State read automatically, it needs a
non-datacenter egress or a registered key — not a better header.

**The 36 State deep links** remain unproven, and are verifiable by hand in a
browser. No automated route exists today.

## Live-run findings (2026-08-11)

**The FCDO leg works.** 36 of 36 countries read, no failures, 36 changes queued as
`pending`. The full loop — fetch, diff, queue, freeze, audit — is proven on this
source. One slug was wrong and the run said so: the Bahamas is `bahamas`, not
`the-bahamas`. Fixed in `advisory-sources.ts`, which also corrects the
traveler-facing deep link.

**State answers 200 with nothing, from Supabase only. Settled — it is the egress,
not our request.**

Three header profiles were tried from the Edge Function in one run:

| Profile | Status | Bytes |
|---|---|---|
| curl-like (`User-Agent: curl/8.7.1`) | 200 | **2** |
| minimal (`Accept: application/json` only) | 200 | **2** |
| browser-like (full Chrome UA) | 200 | **2** |

Two bytes is `[]`. A well-formed, correctly-typed, **empty** JSON array, every
time. Meanwhile a plain `curl` from a laptop got **682,146 bytes** from the same
URL in the same window.

So the headers hypothesis is dead — and that is worth having tested, because it
was the cheap explanation and it would have been embarrassing to ask for an
egress allowlist without ruling it out. `cadataapi.state.gov` returns an empty
array to Supabase's datacenter IPs and real data to a laptop. It degrades
silently rather than returning 403, which is why this looked like a parsing bug
for two runs.

**There is no code fix.** The remaining options are environmental or
source-level:

1. **Ask State for access** — legitimate, free, slow. They publish this data to be
   consumed; a request for programmatic access is a reasonable one.
2. **Try `cadatacatalog.state.gov`** — a different host, possibly not behind the
   same filter. Cheapest thing to try, and untested. See the section below for
   what it actually holds.
3. **Route the State fetch through a non-datacenter egress** — costs money, adds a
   vendor, and arguably works against the filter's intent. Least favourite.
4. **Treat the FCDO as the primary source** — it works at 36/36 today. But it
   carries no numeric level, and our Safety Card is built on the L1–L4 scale, so
   this is a data-model change rather than a swap.

**The RSS is separately empty**, and not a fallback. Its probe shows a
well-formed feed — `<rss><channel><title>travel.state.gov: Travel
Advisories</title>` — with **343 bytes and zero `<item>` elements**, to the
laptop as well as to us. It isn't blocked; there is nothing in it.

### What the CA data catalog holds — and the code trap in it

`cadatacatalog.state.gov/Datasets` (screenshot 2026-08-12, David). Ten datasets in
three groups. **Two of them matter to us, one is optional, seven are irrelevant.**

| dataset | formats | verdict |
|---|---|---|
| `TravelAdvisory` | XML + JSON | **Essential.** The levels. This is the whole reason we're here. |
| `GeoPoliticalArea` | JSON | **Essential — see below.** Two-letter country codes. |
| `CountryTravelInfo` | JSON | Optional. Consular Information Sheets — entry rules, local law, health. Enrichment for destination pages, not levels. |
| `GeoPoliticalRegion` | JSON | No. Our regions are the 13-code MVP scheme; theirs would only invite a mapping nobody asked for. |
| six Passport datasets | JSON | No. Application and issuance volumes, 1986–2015. |

> ### ⚠ CORRECTION, 2026-08-17 — read this before the section below it
>
> The section that follows was written from the catalog's *description* of
> `GeoPoliticalArea`, before either file had been read. Its diagnosis of the trap
> is right and its prescription is **wrong**, and both are left standing because
> the difference between them is the lesson.
>
> It says: build a FIPS→ISO map from `GeoPoliticalArea` and join on the code.
> **Do not.** Both files have now been read, and the feed's `Country-Tag` is not
> reliably FIPS. Measured across the 197 entries whose title matches a
> `GeoPoliticalArea` name: **182 tags equal the FIPS code, 15 do not.** Some of
> the 15 are ISO 3166-1 (Philippines `PH`, Australia `AU`, Morocco `MA`), some
> are neither (Switzerland `SR`, Malta `ML`, Libya `LB`, Uruguay `UR`, French
> Guiana `A2`, Aruba `AB`).
>
> A mixed key is worse than either pure one, because the odd values collide with
> a **different** country: `SR` is Suriname in ISO, `ML` is Mali, `LB` is Lebanon.
> No map built from `GeoPoliticalArea` fixes that, because the disagreement is
> between the feed and State's own code table.
>
> **The join is the country NAME**, which is what the daily checker already
> does — `match: ["uae", "united arab emirates"]` in the generated payload. That
> was right, and reading the catalog's description nearly argued us into
> replacing a correct name-match with a broken code-match on the strength of one
> sentence of documentation.
>
> `GeoPoliticalArea` is still worth having. It is a **cross-check**, not a key.
>
> The lesson is the same one as the State matrix, one level up: *a description of
> data is not data.* Read the file.

**THE TRAP, and it is the silent kind.** The catalog says of `GeoPoliticalArea`:

> *"Geo-Political TAGS consist of two-letter codes for countries. The country codes
> are taken from the Federal Information Processing Standards Publication No. 10
> (FIPS)."*

**FIPS 10-4 is not ISO 3166-1 alpha-2.** Both are two uppercase letters, both key a
country, and they disagree for a substantial number of countries. Our entire safety
spine is keyed on ISO alpha-2 — `COUNTRY_ISO`, `safety.json`, `emergency-numbers.ts`
all join on it.

So a join that takes State's two-letter code as if it were ISO does not fail. It
**succeeds against the wrong country**, and produces exactly the failure mode this
repo keeps finding: a confidently-rendered page carrying another country's advisory
level, with nothing on it to suggest anything is wrong. It is the East-Africa
fallback bug again, arriving through a different door.

**Do not hand-write the FIPS→ISO map from memory.** The disagreements are the whole
point and a remembered pair is indistinguishable from a looked-up one — which is
the failure `docs/ground-truth.md` exists to prevent. `GeoPoliticalArea` is the
authority; build the map from the file, commit it as generated, and make an
unmapped code a hard error rather than a pass-through. A pass-through here means an
unrecognised code silently becomes a country.

**Answered 2026-08-20 — no.** These files are **not** fetchable from a datacenter
IP: 403 with a 5497-byte edge block page to all three header profiles, both
datasets. The URLs are `cadatacatalog.state.gov/download/traveladvisory` and
`/download/geopoliticalarea` (David, 2026-08-17); the run is recorded under *"The
cell is filled"* above, along with the one laptop `curl` that would separate an
egress block from a browser-challenge block.

Practically this costs us little: the FIPS→ISO map these files would author is
**not** on the critical path, because the advisory join is the country **name**,
not the two-letter code (see the correction above). The files Sana pasted on
12 August remain the authority if we ever do build it.

*The `#void` on `cadatacatalog.state.gov/Datasets` is a JavaScript placeholder —
the download links render in-page, which is why the endpoints had to come from
the page rather than the address bar.*

#### Filling that cell — the probe

```
curl -s "https://<project>.supabase.co/functions/v1/advisory-check?probe=state-catalog" \
  -H "Authorization: Bearer $ANON_KEY" | jq
```

Both datasets × all three header profiles, from the datacenter IP. It **writes
nothing** — no `advisory_runs` row, no `advisory_state` — because a probe that
leaves a run record makes a diagnostic look like a check, and `checked: 0` is
indistinguishable from a real run that found nothing.

It reports `status`, `bytes`, `shape` and a content head per attempt rather than
a boolean. Two bytes, an HTML block page and a megabyte of JSON are three
different answers; a pass/fail collapses them into one, and this is the exact
question that has been mis-diagnosed three times from single readings.

**Whatever it returns, add it to the matrix above.** Six new cells, dated, with
the command recorded. Do not overwrite the existing rows — the residential cell
stays true regardless of what this one says.

*Run 2026-08-20. Six cells added, existing rows untouched. Result: 403 across the
board — see "The cell is filled" above.*

### What the feed actually gave us, once read

Snapshot 2026-08-17 (`feed.updated` 09:28Z the same morning — it is live and
current). 223 entries, every one carrying a `Threat-Level`: 86 at L1, 86 at L2,
28 at L3, 23 at L4. Reduced to the fields we use and committed as
`src/data/state-advisory-feed.json`.

**It is richer than "the levels".** Four things came out of one read:

1. **Two of our curated levels were wrong, in both directions.** Saint Lucia sat
   at L1 in our data; State moved it to **L2 on 2026-07-10** — six weeks of
   showing travelers a *less strict* level than the source. Thailand sat at L2;
   State **decreased it to L1 on 2026-07-07**, which by David's own rule
   (2026-08-11) is not housekeeping — it is the difference between a gated
   country and a bookable one. Both fixed. `gen:ground-truth` now compares our
   level against the snapshot on every run, so the next drift is a failing check
   rather than a discovery.
2. **State publishes its own URL per country, and 14 of our 36 derived links were
   wrong.** Thirteen because State is migrating to `destination.<iso3>.html` and
   our rule produced the old shape; one — Turks & Caicos — because our slug was
   simply wrong. `advisoryLinks()` now prefers the published URL and derives only
   where the feed has no entry. **This retires the State half of the unverified
   link problem without needing a network run at all** — the source handed us the
   answers. FCDO and CDC links still need `npm run check:advisory-links`.
3. **The summary HTML carries sub-country carve-outs** — exactly the `zones[]`
   shape. Spain is L2 with **Ceuta at L3**, which we carried nowhere. Jordan has
   Zarqa City (L3) and Mansheyat al Ghayyath / Ruwayshid (L4) that our row
   omitted. Our Thailand–Cambodia border zone was held at L4 on **both** sides;
   State has the Cambodian side at L4 and the Thai side at L2. Mirroring a
   neighbour's zone onto our own row is a guess that looks like symmetry.
4. **Ethiopia is in the feed** at L3 with thirteen L4 regions. That row had been
   the one deliberately-failing conformance check since `COUNTRY_ISO` gained the
   entry. It is now authored from the primary source and the check is green.

**Austria is absent from the feed** — no entry at all, so its State link is still
derived and still unverified. Worth knowing rather than assuming coverage is
total: 36 of our 38 countries appear.

## What isn't done yet

- **The CDC leg.** State and the FCDO are wired; CDC health notices are the
  fastest-moving layer and are the next thing to add.
- **The site doesn't read `advisory_state` yet.** The Safety Card still renders
  from the bundled `safety.json`. That's the right order — get the checker
  trustworthy first, then switch the read — but until it happens this pipeline
  informs *us*, not the page.
- **Nothing has been run against a live source.** The build sandbox has no
  outbound network, so parsing is written against the documented shapes and needs
  one real run to confirm the field names. Expect to adjust `readState`'s field
  mapping on first contact; that's the point of the run log.
