import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Icon } from "@/lib/icons";
import { LOCALES } from "@/data/taxonomy";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { fetchTravelId, pendingAsRecord } from "@/lib/travelId";
import { Logo } from "./Logo";

export function Header() {
  const { locale, setLocale, openPanel, trip, user } = useStore();
  const t = useT();
  const [localeOpen, setLocaleOpen] = useState(false);
  const localeRef = useRef<HTMLDivElement>(null);
  // WHO the header greets (Sana, 2026-08-27): "the navbar should not say
  // Sign in while we are already in." Three states, best name wins:
  //   signed in            → the Travel ID's display_name (email prefix only
  //                          while that loads or if none was ever saved)
  //   signed UP, link not  → the pending Travel ID's name — this person just
  //   yet clicked            typed it; showing "Sign in" to them reads as
  //                          "your sign-up didn't take"
  //   cold visitor         → "Sign in"
  const [displayName, setDisplayName] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (user) {
      setDisplayName(pendingAsRecord()?.display_name ?? null);
      fetchTravelId(user.id).then((r) => { if (live && r?.display_name) setDisplayName(r.display_name); });
    } else {
      setDisplayName(pendingAsRecord()?.display_name ?? null);
    }
    return () => { live = false; };
  }, [user]);
  const firstName = displayName ? displayName.trim().split(/\s+/)[0] : null;
  const L = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) setLocaleOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <header className="tw-header">
      <div className="tw-header__bar">
        <button className="tw-iconbtn tw-burger" aria-label="Menu" onClick={() => openPanel("mega")}>
          <Icon name="menu" />
        </button>
        <Logo />
        <nav className="tw-nav" aria-label="Primary">
          <button className="tw-nav__trigger" aria-controls="tw-mega" onClick={() => openPanel("mega")}>
            {t("nav.worlds")} <Icon name="chev" small className="chev" />
          </button>
          <Link className="tw-nav__link" to="/plan">{t("nav.plan")}</Link>
          <Link className="tw-nav__link tw-nav__link--read" to="/guides">{t("nav.guides")}</Link>
          {/* "About" left the primary nav to make room for "Read Before Travel"
              (David 2026-08-10). Measured, the bar overflowed by 66px with both;
              something had to go, and About is reachable from the menu and twice
              from the footer, while Read Before Travel is the safety instruction.
              Reversible in one line if the trade should go the other way. */}
        </nav>
        <div className="tw-header__spacer" />
        <div className="tw-header__actions">
          {user || firstName
            ? <Link className="tw-signin tw-signin--me" to="/profile" title="Your Travel ID">
                <span className="tw-me-av" aria-hidden="true">{(firstName ?? user?.email ?? "A").charAt(0).toUpperCase()}</span>
                {firstName ?? (user?.email ? user.email.split("@")[0] : "Account")}
              </Link>
            : <Link className="tw-signin" to="/signin">{t("nav.signin")}</Link>}
          <div className="tw-locale" ref={localeRef}>
            <button
              className="tw-locale__btn"
              aria-label="Change language"
              aria-haspopup="true"
              aria-expanded={localeOpen}
              onClick={(e) => { e.stopPropagation(); setLocaleOpen((o) => !o); }}
            >
              <Icon name="globe" small /> <span className="loc-lbl">{L.code.toUpperCase()}</span> <Icon name="chev" small />
            </button>
            {localeOpen && (
              <div className="tw-locale__menu">
                <div className="tw-locale__group">Launch languages</div>
                {LOCALES.filter((l) => l.tier === "launch").map((l) => (
                  <button
                    key={l.code} className="tw-locale__item"
                    aria-current={l.code === locale || undefined}
                    onClick={() => { setLocale(l.code); setLocaleOpen(false); }}
                  >
                    {l.label}<span className="native">{l.native}</span>
                  </button>
                ))}
                <div className="tw-locale__group">Coming soon</div>
                {LOCALES.filter((l) => l.tier === "staged").map((l) => (
                  <button
                    key={l.code} className="tw-locale__item"
                    aria-current={l.code === locale || undefined}
                    onClick={() => { setLocale(l.code); setLocaleOpen(false); }}
                  >
                    {l.label}<span className="native">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* THE emergency control — one, in the sticky header, on every page and at
              every scroll position. Solid red and labelled, because the test is
              "found in a hurry, on a phone, without hunting" — an outline icon
              among other outline icons fails that. Placement is deliberate: the
              header never overlaps content, unlike the floating stack it replaces. */}
          <button className="tw-emerg-btn" aria-label="Emergency help — emergency numbers and first aid" onClick={() => openPanel("emergency")}>
            {/* A white cross on red, not the SOS starburst. On a narrow header the
                label collapses and the glyph is all a person has to go on, so it
                has to be the symbol everyone already reads as "help". */}
            <Icon name="cross" />
            <span className="lbl">Emergency</span>
          </button>
          <button className="tw-trip-btn" aria-label="Your Trip" onClick={() => openPanel("tray")}>
            <Icon name="bag2" /> <span className="lbl">Trip</span>
            {trip.length > 0 && <span className="badge">{trip.length}</span>}
          </button>
          <button className="tw-talk-btn" aria-label={t("nav.atlas")} onClick={() => openPanel("concierge")}>
            <Icon name="sparkles" small /> <span className="lbl">{t("nav.atlas")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
