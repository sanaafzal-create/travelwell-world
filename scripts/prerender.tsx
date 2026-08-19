/**
 * PRERENDER — put real page bodies into the static HTML.
 *
 *   npm run prerender      (runs at the end of `npm run build`)
 *
 * ── What this fixes ────────────────────────────────────────────────────────
 * `gen-static-heads` already writes a per-route `<head>`: title, description,
 * canonical, og tags and the JSON-LD. Measured before this script existed, a
 * destination page served **1 character of visible body text** and no `<h1>` —
 * eleven structured-data blocks describing a page whose prose a crawler could
 * not read. Everything below the head was a client-side render.
 *
 * This runs after the heads, walks every page they wrote, renders the real React
 * app for that route, and injects the result into `<div id="root">`. Same
 * components, same data, no second renderer to drift.
 *
 * ── Three things that had to be solved, all measured rather than assumed ───
 *
 * 1 · `renderToString` CANNOT DO IT. Every page is `React.lazy`, and the sync
 *     renderer emits the Suspense fallback — 25KB of shell with an empty
 *     `<main>`. `renderToPipeableStream` with `onAllReady` resolves the lazy
 *     boundaries and produces 45KB with the page in it. That is the whole
 *     unblock and it is one function call.
 *
 * 2 · THE CATALOG HAD TO BE SEEDED AT CREATION, NOT AFTER. zustand v4 renders
 *     from `getServerState || getInitialState` on the server, so a `setState`
 *     after the store exists is invisible to a server render: the store reported
 *     504 destinations while the component reading from it saw 44. And
 *     `create()` copies the api onto the hook, so `getServerState` cannot be
 *     patched from outside either. The fix is an SSR-only alias that swaps
 *     `@/data/places` for a module whose `DESTINATIONS` is the merged set. The
 *     browser bundle never sees it, so the library stays out of the download.
 *
 * 3 · DATABASE ACCESS IS NOT NEEDED AND NEVER WAS. This was the open question:
 *     if the build reads only the bundle, the pages get built with 44 rather
 *     than the full library. The answer is that the drop-in files ARE the
 *     source — `mergedDestinations()` reads `src/data/destinations/`, so the
 *     prerender has every ingested row at build time with no Supabase round
 *     trip and no credentials in the build.
 */
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.mjs";
import { Writable } from "node:stream";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import App from "@/App";

const DIST = "dist";

/** Every page `gen-static-heads` wrote — found on disk rather than re-listed. */
function pageFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      // Vite's asset output has nothing to prerender and is large.
      if (name === "assets") continue;
      pageFiles(p, out);
    } else if (name === "index.html") out.push(p);
  }
  return out;
}

/** dist/destination/paris-france/index.html → /destination/paris-france */
const routeOf = (file: string): string => {
  const rel = relative(DIST, file).split(sep).slice(0, -1).join("/");
  return rel ? `/${rel}` : "/";
};

function renderRoute(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = "";
    const sink = new Writable({ write(c, _e, cb) { html += c.toString(); cb(); } });
    let failed: unknown = null;
    const { pipe } = renderToPipeableStream(
      <StaticRouter location={url}><App /></StaticRouter>,
      {
        onAllReady() {
          pipe(sink);
          sink.on("finish", () => (failed ? reject(failed) : resolve(html)));
        },
        // A route that throws must not silently ship an empty body — the page
        // would look fine to a human (the client renders it) and be blank to
        // every crawler, which is the failure this script exists to end.
        onError(err) { failed = err; },
      },
    );
  });
}

const files = pageFiles(DIST);
let done = 0, injected = 0, skipped = 0, failedCount = 0;
const failures: string[] = [];
let totalText = 0;

for (const file of files) {
  const url = routeOf(file);
  const shell = readFileSync(file, "utf8");
  if (!shell.includes('<div id="root"></div>')) { skipped++; continue; }
  let body: string;
  try {
    body = await renderRoute(url);
  } catch (err) {
    failedCount++;
    failures.push(`${url} — ${String(err).split("\n")[0].slice(0, 120)}`);
    continue;
  }
  writeFileSync(file, shell.replace('<div id="root"></div>', `<div id="root">${body}</div>`));
  injected++;
  totalText += body.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  done++;
}

const avg = injected ? Math.round(totalText / injected) : 0;
console.log(`Prerendered ${injected}/${files.length} pages — average ${avg} chars of body text each.`);
if (skipped) console.log(`  ${skipped} skipped (no root div — already prerendered or not an app page).`);
if (failedCount) {
  console.log(`\n✗ ${failedCount} route(s) failed to render and shipped with an EMPTY body:`);
  for (const f of failures.slice(0, 20)) console.log("  ✗ " + f);
  console.log(`\nThese pages work for a human and are blank to every crawler, which is the`);
  console.log(`exact failure this script exists to end. Fix before shipping.`);
  process.exit(1);
}
