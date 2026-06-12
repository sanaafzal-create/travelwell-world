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

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <MegaMenu />
      <main id="main" className="tw-main">
        <Outlet />
      </main>
      <Footer />
      <Concierge />
      <TripTray />
      <Emergency />
      <Ambient />
    </>
  );
}
