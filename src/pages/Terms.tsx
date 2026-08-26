import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/ui/LegalLayout";
import { LEGAL_ENTITY, GOVERNING_LAW } from "@/lib/legal";

// NOTE: Plain-language terms reflecting TravelWell's actual model (we organize
// and hand off; providers are the merchant of record). Not legal advice — have
// counsel review, and set the governing-law jurisdiction, before relying on it.
export default function Terms() {
  return (
    <LegalLayout eyebrow="Legal" title="Terms of Service" updated="26 August 2026">
      <p>These terms cover your use of TravelWell.World, operated by {LEGAL_ENTITY} (&ldquo;TravelWell,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). By using the site, you agree to them.</p>

      <h2>What TravelWell is</h2>
      <p>TravelWell is a travel-planning companion. We help you discover destinations, shape a trip, and organize it — and we surface travel providers and hand you to them to book. <strong>We are not a travel agent or the merchant of record.</strong> You book and pay each provider directly, under their own terms. Atlas suggests and organizes; you always make the choices.</p>

      <h2>Bookings, prices &amp; accuracy</h2>
      <p>Provider availability, prices, and details are set by the providers and can change. We work to keep our content accurate and sourced, but we can't guarantee it — always confirm the specifics (including safety, visa, and health requirements) with the provider and official sources before you book or travel.</p>

      <h2>Affiliate relationships</h2>
      <p>We may earn a commission when you book through links we surface, at no extra cost to you. It never changes your price, and it never changes our ranking — options are ordered by fit to you, not by commission. Full detail in our <Link to="/disclosure">Affiliate Disclosure</Link>.</p>

      <h2>Using TravelWell responsibly</h2>
      <p>Please use the site lawfully and don't misuse, disrupt, or attempt to break it. Your Travel ID is yours; keep your account access to yourself.</p>

      <h2>No warranties &amp; limitation of liability</h2>
      <p>TravelWell is provided "as is." To the fullest extent permitted by law, we aren't liable for your dealings with providers or for indirect or consequential losses arising from use of the site. Your travel arrangements are between you and the providers you book.</p>

      {/* ── THE PLACEHOLDER WAS PUBLIC (2026-08-26) ──────────────────────────
          This read "…the jurisdiction in which TravelWell.World operates.
          (Specific jurisdiction to be confirmed.)" — an internal to-do, shipped
          on a legal page, telling every reader the document is unfinished.

          The clause is not filled in with a plausible state. We do not hold that
          fact, and a governing-law clause naming the wrong state reads exactly
          like one somebody checked. Until `GOVERNING_LAW` is set, the section
          says what is true: it is with counsel. */}
      <h2>Governing law</h2>
      {GOVERNING_LAW ? (
        <p>These terms are governed by the laws of {GOVERNING_LAW}, without regard to its conflict-of-laws rules.</p>
      ) : (
        <p>{LEGAL_ENTITY} is a United States limited liability company. The governing law and venue for these terms are being settled with our counsel and will be stated here once they are; until then, nothing in this section limits any right you have under the law that applies where you live.</p>
      )}

      <h2>Changes &amp; contact</h2>
      <p>We may update these terms; we'll revise the date above when we do. Questions? <Link to="/contact">Contact us</Link>.</p>
    </LegalLayout>
  );
}
