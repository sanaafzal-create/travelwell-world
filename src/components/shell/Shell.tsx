import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { MegaMenu } from "./MegaMenu";
import { Footer } from "./Footer";
import { Concierge } from "./Concierge";
import { TripTray } from "./TripTray";
import { Emergency } from "./Emergency";
import { Ambient } from "./Ambient";
import { useStore, applyInitialLocale } from "@/store/useStore";

// Map a route to the page-scope slug used by src/styles/pages.css. Every page
// block in pages.css is scoped under [data-page="<slug>"] so per-page styles
// can never leak into another page (see the styles refactor).
const PAGE_SLUGS: Record<string, string> = {
  "special-interests": "special-interests", "si": "si-detail",
  "regions": "regions", "region": "region-detail", "activities": "activities",
  "wells": "wells", "wells-surface": "wells-surface", "well": "well-detail",
  "providers": "providers", "destinations": "destinations", "destination": "destination-detail",
  "guides": "guides", "guide": "guide-detail", "plan": "plan",
  "first-aid-kit": "first-aid-kit", "go": "go", "about": "about", "profile": "profile",
  "signin": "sign-in", "verify": "verify-email", "sitemap": "sitemap",
  "itinerary": "itinerary", "luxury": "luxury", "demo": "demo", "vc-demo": "demo",
  "signup": "sign-up", "activation": "activation",
};
function pageSlug(pathname: string): string {
  const p = pathname.replace(/\/+$/, "");
  if (p === "") return "home";
  const first = p.split("/").filter(Boolean)[0] ?? "home";
  return PAGE_SLUGS[first] ?? first;
}

// Full-bleed auth/onboarding pages render without the standard footer.
const NO_FOOTER = new Set(["sign-in", "verify-email", "sign-up", "activation", "go"]);

export function Shell() {
  const { panel, closePanel } = useStore();
  const location = useLocation();

  // ESC closes any open panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePanel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closePanel]);

  // Apply persisted locale/dir once.
  useEffect(() => { applyInitialLocale(); }, []);

  // Close panels + scroll to top on route change.
  useEffect(() => {
    closePanel();
    window.scrollTo(0, 0);
  }, [location.pathname, closePanel]);

  // Lock body scroll when a full overlay is open.
  useEffect(() => {
    document.body.style.overflow = panel === "emergency" ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [panel]);

  const slug = pageSlug(location.pathname);
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <MegaMenu />
      <main id="main" className="tw-main" data-page={slug}>
        <Outlet />
      </main>
      {!NO_FOOTER.has(slug) && <Footer />}
      <Concierge />
      <TripTray />
      <Emergency />
      <Ambient />
    </>
  );
}
