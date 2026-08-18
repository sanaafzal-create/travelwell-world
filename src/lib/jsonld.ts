/**
 * Structured data (JSON-LD) for AI answer engines + search (AEO).
 *
 * Emits schema.org `TouristDestination` + — when a dossier carries buffet Q&A
 * in `data.faq` — a `FAQPage`, so crawlers parse the page into clean, quotable
 * chunks (David's buffet-block strategy, machine-readable).
 *
 * AUTHORITATIVE when baked into the server-rendered <head> (the SSG socket —
 * that's where this belongs long-term). Injected client-side here as a stopgap:
 * JS-rendering crawlers (Google) read it now; pure answer-engine bots need the
 * SSG render to see it. So this is real prep, not the finish line.
 */
import { useEffect } from "react";
import type { Destination } from "@/data/places";
import type { SiData } from "@/data/taxonomy";
import type { PlacedJewel } from "@/lib/jewels";

// The canonical origin. Imported rather than declared here: it also runs at
// BUILD time inside `gen-static-heads`, and a structured-data URL that differs
// between the served HTML and the client-injected copy is worse than one that is
// simply absolute. See src/lib/site.ts for why it is `www`.
import { ORIGIN } from "@/lib/site";

/**
 * The organization record lives STATICALLY in index.html so a crawler that
 * doesn't run JavaScript still reads the brand spelled correctly — it is the
 * field an answer engine quotes when it names us. Page-level objects reference
 * it by @id rather than restating the name, so the brand string exists in
 * exactly one place and can't drift to two words in one of them.
 */
const PUBLISHER = { "@id": `${ORIGIN}/#organization` };

interface Faq { q: string; a: string; source?: string }

/**
 * One `TouristAttraction` per jewel (David's decision 3, 2026-08-12).
 *
 * `TouristAttraction` rather than `Event`: a jewel is a place or a standing
 * experience — a cog railway at sunrise, a glacier spa — available whenever its
 * season is. `Event` requires a `startDate`, and a jewel has a *when* ("clear
 * mornings", "Dec–Apr") that is a condition, not a date. Faking a date to satisfy
 * the schema would put a wrong fact in the machine-readable layer to make the
 * machine-readable layer look complete. Dated things already emit `Event` from
 * the SI dossier's look-ahead, which carries real dates.
 *
 * `isAccessibleForFree` is deliberately absent — we don't hold it, and schema.org
 * has no "unknown". An omitted property reads as unknown; `false` would be a
 * claim.
 */
function jewelAttraction(
  j: { name: string; blurb?: string; when?: string; source?: string; accessed?: string },
  place: { name: string; country: string },
  url: string
): object {
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: j.name,
    ...(j.blurb ? { description: j.blurb } : {}),
    // The containing place, so an answer engine that lifts the attraction out
    // still knows where on earth it is.
    containedInPlace: {
      "@type": "Place",
      name: place.name,
      address: { "@type": "PostalAddress", addressCountry: place.country },
    },
    ...(j.when ? { temporalCoverage: j.when } : {}),
    publisher: PUBLISHER,
    ...(url ? { subjectOf: { "@type": "WebPage", url } } : {}),
    // THE CITATION. A jewel served on an interest page has left its dossier
    // behind; whatever cited it there is no longer anywhere on the page. If we
    // hold a source it goes in the structured data, because that is the copy a
    // machine reads.
    ...(j.source ? { isBasedOn: /^https?:\/\//i.test(j.source) ? { "@type": "WebPage", url: j.source } : j.source } : {}),
    ...(j.accessed ? { dateModified: j.accessed } : {}),
  };
}

/** Build the JSON-LD objects for a destination page. */
export function destinationJsonLd(d: Destination, regionName: string, url: string): object[] {
  const out: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: d.name,
      description: d.line,
      address: { "@type": "PostalAddress", addressCountry: d.country, addressRegion: regionName },
      publisher: PUBLISHER,
      ...(url ? { url } : {}),
    },
  ];
  for (const j of d.data?.jewels ?? []) {
    out.push(jewelAttraction(j, { name: d.name, country: d.country }, url));
  }
  const faq = (d.data as { faq?: Faq[] } | undefined)?.faq;
  if (faq?.length) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.source ? `${f.a} (Source: ${f.source})` : f.a },
      })),
    });
  }
  return out;
}

/**
 * Build the JSON-LD for a Special-Interest page from its nine-layer dossier —
 * `TouristTrip` always, plus `FAQPage` (layer 7) and one `Event` per dated
 * entry in the look-ahead (layer 4b). These are the three types the dossier's
 * own layer-9 manifest names.
 */
export function siJsonLd(
  si: { id: string; name: string; sig: string; data?: SiData },
  url: string,
  /** Jewels rendered on this page — passed in so the structured data describes
   *  what is actually on the page, rather than a second, differently-scoped set.
   *  A crawler comparing the two would be right to trust neither. */
  jewels: PlacedJewel[] = []
): object[] {
  const d = si.data ?? {};
  const out: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: si.name,
      description: d.seo?.description || si.sig,
      publisher: PUBLISHER,
      ...(url ? { url } : {}),
      ...(d.seo?.keywords?.length ? { keywords: d.seo.keywords.join(", ") } : {}),
    },
  ];
  for (const { jewel, dest } of jewels) {
    // The canonical URL is the DESTINATION page, not this interest page. The
    // jewel lives there; pointing a crawler at the interest page would make every
    // interest that surfaces it claim to be its home.
    out.push(jewelAttraction(jewel, { name: dest.name, country: dest.country }, `${ORIGIN}/destination/${dest.id}`));
  }
  if (d.faq?.length) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: d.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.source ? `${f.a} (Source: ${f.source})` : f.a },
      })),
    });
  }
  for (const e of d.events ?? []) {
    // Only emit an Event when we have a real date. schema.org requires startDate,
    // and a year alone would have to be faked into "2027-01-01" — a wrong date is
    // worse than no structured data, so year-only entries render but don't emit.
    if (!e.starts_on) continue;
    out.push({
      "@context": "https://schema.org",
      "@type": "Event",
      name: e.name,
      startDate: e.starts_on,
      ...(e.ends_on ? { endDate: e.ends_on } : {}),
      ...(e.place ? { location: { "@type": "Place", name: e.place } } : {}),
      ...(e.note ? { description: e.note } : {}),
    });
  }
  return out;
}

/** Inject JSON-LD into <head> for the current page; cleans up on unmount. */
export function useJsonLd(objs: object[]) {
  const key = JSON.stringify(objs);
  useEffect(() => {
    if (typeof document === "undefined") return;
    // Drop the build-time copy first. `gen-static-heads` bakes this same
    // structured data into the served HTML so a crawler that doesn't run
    // JavaScript can read it — but a reader that DOES run JavaScript would then
    // hold two copies of every block. Same data twice is not twice as credible.
    document.head.querySelectorAll("script[data-static-ld]").forEach((n) => n.remove());
    const nodes = (JSON.parse(key) as object[]).map((obj) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.text = JSON.stringify(obj);
      document.head.appendChild(s);
      return s;
    });
    return () => nodes.forEach((n) => n.remove());
  }, [key]);
}
