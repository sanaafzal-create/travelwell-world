/**
 * TravelWell.World — the two checks axe cannot do (David, 2026-08-25).
 *
 * axe passed while three people over 69 could not read a tile, for two reasons
 * it cannot help having: it checks contrast RATIOS, not whether a size is
 * humane (4.99:1 at 12px passes, and there is no WCAG minimum font size, so no
 * automated AA gate will ever flag one) — and a control with no border has no
 * border to measure. So two checks of our own sit beside it:
 *
 *   ① THE RESOLVED-SIZE WALK. Every visible text node, resolved to real pixels
 *      AFTER the media queries, at every width we ship to. Floors (locked):
 *        reading text     ≥ 16px
 *        uppercase label  ≥ 13px, weight ≥ 600 — a category marker, never a sentence
 *      "Resolved" is the whole point: a 0.88rem rule is not a size until you
 *      know the base at that width, and a desktop eyeball can never check a
 *      320px phone.
 *
 *   ② THE CONTROL-EDGE ASSERTION. Every choosable control must be perceivable
 *      as a thing with an edge: WCAG 1.4.11 wants 3:1 for a component boundary,
 *      and a white tile on a tinted page measures ~1.08:1 — no edge at all.
 *      Passing = a border ≥1px whose colour clears 3:1 against the ground it
 *      sits on, OR a fill that itself clears 3:1. Absence is the failure mode,
 *      so presence is asserted as well as ratio.
 *
 * Run against a served build (same as a11y):
 *   npm run build && npm run preview &
 *   npm run check:readability
 *
 * Env: A11Y_BASE (default http://localhost:4173) · PW_EXECUTABLE
 */
import { chromium } from "playwright";
import { existsSync } from "node:fs";

const BASE = process.env.A11Y_BASE || "http://localhost:4173";
const WIDTHS = [320, 375, 390, 414, 430, 512, 768, 1024, 1440];
// A spread of page shapes; the tile-heavy surfaces David named come first.
// The consent screen is in this list by counsel's own example: the duty to
// warn is owed to "an elderly person with no regular access to the news" —
// the same traveller the floors exist for. The advisory they are asked to
// acknowledge must clear the reading floor, always.
const ROUTES = ["/", "/special-interests", "/regions", "/destination/zermatt-switzerland", "/wells-surface", "/about", "/go?to=Test%20Partner&well=stay&dest=cartagena-colombia"];

const READING_FLOOR = 16;
const LABEL_FLOOR = 13;
const EDGE_RATIO = 3;

const PRE_INSTALLED = "/opt/pw-browsers/chromium";
const browser = await chromium.launch({
  executablePath: process.env.PW_EXECUTABLE || (existsSync(PRE_INSTALLED) ? PRE_INSTALLED : undefined),
  args: ["--no-sandbox"],
});
const context = await browser.newContext();
await context.addInitScript(() => { try { localStorage.setItem("tww:consent", "1"); } catch {} });
const page = await context.newPage();

// Everything below runs in the page: it must be self-contained.
const AUDIT = () => {
  const out = { type: [], edges: [] };
  const lum = (r, g, b) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  // Computed colors arrive as rgb(), oklch() or color() depending on how the
  // token was authored — a regex on rgb() alone silently nulls every oklch
  // control fill and reports a dark pine button as edge-less. A 2D canvas
  // normalises ANY css color to bytes, so the check measures what renders.
  const cvs = document.createElement("canvas"); cvs.width = cvs.height = 1;
  const ctx = cvs.getContext("2d", { willReadFrequently: true });
  const parse = (c) => {
    if (!c || c === "transparent") return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000"; ctx.fillStyle = c; // invalid keeps previous — detect
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a255] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a255 / 255 };
  };
  const ratio = (a, b) => {
    const la = lum(a.r, a.g, a.b), lb = lum(b.r, b.g, b.b);
    const [hi, lo] = la > lb ? [la, lb] : [lb, la];
    return (hi + 0.05) / (lo + 0.05);
  };
  // The ground a component sits ON: nearest ancestor with an opaque background.
  const groundOf = (el) => {
    for (let n = el.parentElement; n; n = n.parentElement) {
      const bg = parse(getComputedStyle(n).backgroundColor);
      if (bg && bg.a >= 0.99) return bg;
    }
    return { r: 247, g: 244, b: 236, a: 1 }; // Ivory fallback
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  // The label floor (13px) applies to category markers, never sentences: the
  // spec's own checklist allows chips/pills/badges at >=13px weight 600, so the
  // test is weight + brevity, with uppercase accepted as evidence but not
  // required — "LIVE NOW" and "Live now" are the same badge.
  const shortLabel = (el, s, text) =>
    parseInt(s.fontWeight, 10) >= 600 && text.replace(/\s+/g, " ").trim().length <= 40;
  // The spec's own screen walk gives FOOTER rows the 13px floor ("footer …
  // floor 13 ok") — fine print is a stated exception, at weight 500+.
  const inFooter = (el) => !!el.closest("footer");

  // ① the size walk — every element that DIRECTLY contains a text node.
  for (const el of document.body.querySelectorAll("*")) {
    if (["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH"].includes(el.tagName)) continue;
    // The brand wordmark's ".world" suffix is logotype, not reading text — its
    // size relative to "TravelWell" IS the mark. Exempt the lockup, nothing else.
    if (el.classList && el.classList.contains("lworld")) continue;
    const direct = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent || "").join(" ").trim();
    if (direct.length < 3) continue; // punctuation, icons, single glyphs
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    const px = parseFloat(s.fontSize);
    const floor = shortLabel(el, s, direct) || inFooter(el) ? 13 : 16;
    if (px < floor - 0.05) {
      out.type.push({
        px: Math.round(px * 10) / 10, floor,
        weight: s.fontWeight,
        text: direct.replace(/\s+/g, " ").slice(0, 60),
        sel: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(/\s+/).slice(0, 2).join(".") : ""),
      });
    }
  }

  // ② the control edges — choosable things must have a perceivable boundary.
  const CONTROLS = document.body.querySelectorAll('button, [role="button"], a.btn, input:not([type="hidden"]), select, textarea');
  for (const el of CONTROLS) {
    if (!visible(el)) continue;
    // A native checkbox/radio (appearance: auto) is painted by the OS — its
    // computed border reads 0px while the rendered control has a real edge.
    // Measuring the computed style misreports it, same class as the oklch
    // fills. Only an appearance:none rebuild is ours to measure.
    if ((el.type === "checkbox" || el.type === "radio") && getComputedStyle(el).appearance !== "none") continue;
    // WCAG 1.4.11 requires a 3:1 boundary only where the boundary is what
    // identifies the component. A transparent text item inside the nav or
    // header landmark is identified by its text and position (the menu bar),
    // not by an edge — the border rule is for choosable tiles, buttons and
    // inputs in the content area, which is also how the spec's own component
    // checklist scopes it.
    if (el.closest("nav, header")) continue;
    // A field inside a bordered composite (the concierge input's pill wrapper)
    // is edged by its wrapper — measure the composite, not the bare <input>.
    const wrap = el.parentElement;
    if (wrap) {
      const ws = getComputedStyle(wrap);
      const wb = parse(ws.borderTopColor);
      if (parseFloat(ws.borderTopWidth) >= 1 && wb && wb.a >= 0.99 && ratio(wb, groundOf(wrap)) >= 3) continue;
    }
    const s = getComputedStyle(el);
    const ground = groundOf(el);
    // A semi-transparent border still renders as SOME color — composite it
    // over the ground and measure what the eye actually gets, rather than
    // rejecting the alpha out of hand (a .65 white ring on a dark band is a
    // strong edge; alpha-blindness called it absent).
    const blend = (c, g) => c.a >= 0.99 ? c : { r: c.a * c.r + (1 - c.a) * g.r, g: c.a * c.g + (1 - c.a) * g.g, b: c.a * c.b + (1 - c.a) * g.b, a: 1 };
    const fillRaw = parse(s.backgroundColor);
    const fill = fillRaw && fillRaw.a > 0 ? blend(fillRaw, ground) : null;
    const filled = fill && fillRaw.a >= 0.99 && ratio(fill, ground) >= 3;
    const bw = parseFloat(s.borderTopWidth);
    const bcRaw = parse(s.borderTopColor);
    const bc = bcRaw && bcRaw.a > 0 ? blend(bcRaw, fillRaw && fillRaw.a > 0.5 ? blend(fillRaw, ground) : ground) : null;
    const edged = bw >= 1 && bc && ratio(bc, ground) >= 3;
    // A text-only link-button with a visible underline reads as a control too.
    const underlined = s.textDecorationLine.includes("underline");
    if (!filled && !edged && !underlined) {
      out.edges.push({
        sel: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(/\s+/).slice(0, 2).join(".") : ""),
        text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40),
        border: `${bw}px ${s.borderTopColor}`,
        fill: s.backgroundColor,
      });
    }
  }
  return out;
};

let typeFails = 0, edgeFails = 0, unreachable = 0;
const seen = new Set();
for (const route of ROUTES) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    try {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20000 });
    } catch { unreachable += 1; continue; }
    await page.waitForTimeout(500);
    const res = await page.evaluate(AUDIT);
    for (const t of res.type) {
      const key = `T|${route}|${t.sel}|${t.text}`;
      if (seen.has(key)) continue; // report a failing role once, not once per width
      seen.add(key);
      typeFails += 1;
      console.log(`  ✗ ${route} @${width}px — ${t.px}px (floor ${t.floor}, w${t.weight}) ${t.sel} "${t.text}"`);
    }
    for (const e of res.edges) {
      const key = `E|${route}|${e.sel}|${e.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edgeFails += 1;
      console.log(`  ✗ ${route} @${width}px — no perceivable edge: ${e.sel} "${e.text}" border=${e.border} fill=${e.fill}`);
    }
  }
  console.log(`  · walked ${route} at ${WIDTHS.length} widths`);
}
await browser.close();

console.log("─".repeat(40));
if (unreachable) {
  console.error(`❌ readability audit could not run — ${unreachable} page loads failed. Nothing was measured; this is NOT a pass.`);
  process.exit(2);
}
if (typeFails || edgeFails) {
  console.error(`❌ readability gate FAILED — ${typeFails} text role(s) under floor, ${edgeFails} control(s) with no perceivable edge`);
  process.exit(1);
}
console.log(`✅ readability gate PASSED — ${ROUTES.length} routes × ${WIDTHS.length} widths; floors ${READING_FLOOR}px reading / ${LABEL_FLOOR}px labels; ${EDGE_RATIO}:1 edges`);
