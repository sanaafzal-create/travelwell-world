import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/ui/LegalLayout";

// NOTE: Plain-language terms reflecting TravelWell's actual model (we organize
// and hand off; providers are the merchant of record). Not legal advice — have
// counsel review, and set the governing-law jurisdiction, before relying on it.
export default function Terms() {
  return (
    <LegalLayout eyebrow="Legal" title="Terms of Service" updated="6 July 2026">
      <p>These terms cover your use of TravelWell.World. By using the site, you agree to them.</p>

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

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the jurisdiction in which TravelWell.World operates. <em>(Specific jurisdiction to be confirmed.)</em></p>

      <h2>Changes &amp; contact</h2>
      <p>We may update these terms; we'll revise the date above when we do. Questions? <Link to="/contact">Contact us</Link>.</p>
    </LegalLayout>
  );
}
