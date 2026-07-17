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

interface Faq { q: string; a: string; source?: string }

/** Build the JSON-LD objects for a destination page. */
export function destinationJsonLd(d: Destination, regionName: string, url: string): object[] {
  const out: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: d.name,
      description: d.line,
      address: { "@type": "PostalAddress", addressCountry: d.country, addressRegion: regionName },
      ...(url ? { url } : {}),
    },
  ];
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

/** Inject JSON-LD into <head> for the current page; cleans up on unmount. */
export function useJsonLd(objs: object[]) {
  const key = JSON.stringify(objs);
  useEffect(() => {
    if (typeof document === "undefined") return;
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
