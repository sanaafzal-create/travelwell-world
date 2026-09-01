#!/usr/bin/env node
/**
 * Validate the structured data in every BUILT page.
 *
 *   npm run check:jsonld        (runs in CI after the build, beside check:brand)
 *
 * WHY. Search Console reported a critical Breadcrumbs issue (2026-08-30):
 * "Either 'name' or 'item.name' should be specified (in 'itemListElement')".
 * The current build scanned clean — 635 pages, zero nameless items — so the
 * report described a stale crawl. But nothing GUARDED that: the builders are
 * careful, and careful is not a gate. This reads what a crawler actually
 * receives and refuses the classes Google refuses:
 *   · any <script type="application/ld+json"> that does not parse as JSON;
 *   · any BreadcrumbList item without a non-empty `name` (or `item.name`);
 *   · any BreadcrumbList item without a `position`;
 *   · any FAQPage question without a non-empty name or answer text.
 * Reads dist/ — run after `npm run build`. No network, no server.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const files = execFileSync("find", ["dist", "-name", "index.html"], { encoding: "utf8" })
  .split("\n").filter(Boolean);
if (files.length < 100) {
  console.error(`✗ BLOCKED — only ${files.length} built pages found; run \`npm run build\` first. Nothing was validated; this is NOT a pass.`);
  process.exit(2);
}

const errs = [];
let blocks = 0, crumbs = 0, faqs = 0;

for (const f of files) {
  const html = readFileSync(f, "utf8");
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    blocks++;
    let obj;
    try { obj = JSON.parse(m[1]); }
    catch { errs.push(`${f}: ld+json block does not parse as JSON`); continue; }
    for (const o of Array.isArray(obj) ? obj : [obj]) {
      if (o?.["@type"] === "BreadcrumbList") {
        crumbs++;
        for (const it of o.itemListElement ?? []) {
          const name = it?.name ?? it?.item?.name;
          if (!name || !String(name).trim()) errs.push(`${f}: BreadcrumbList item at position ${it?.position ?? "?"} has no name`);
          if (it?.position == null) errs.push(`${f}: BreadcrumbList item missing position`);
        }
      }
      if (o?.["@type"] === "FAQPage") {
        faqs++;
        for (const q of o.mainEntity ?? []) {
          if (!q?.name?.trim()) errs.push(`${f}: FAQPage question with no name`);
          if (!q?.acceptedAnswer?.text?.trim()) errs.push(`${f}: FAQPage question "${(q?.name ?? "").slice(0, 40)}" with no answer text`);
        }
      }
    }
  }
}

if (errs.length) {
  console.error(`✗ STRUCTURED DATA — ${errs.length} defect(s) in the built pages:`);
  errs.slice(0, 15).forEach((e) => console.error("  ✗ " + e));
  if (errs.length > 15) console.error(`  …and ${errs.length - 15} more`);
  process.exit(1);
}
console.log(`✓ structured data valid — ${files.length} pages, ${blocks} ld+json blocks, ${crumbs} breadcrumb lists, ${faqs} FAQ pages; every breadcrumb item named.`);
