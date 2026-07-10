import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/ui/LegalLayout";

// FTC-style affiliate/advertising disclosure. Reflects the locked model:
// surface → hand off → the traveler books and pays the provider directly.
export default function Disclosure() {
  return (
    <LegalLayout eyebrow="Legal" title="Affiliate &amp; Advertising Disclosure" updated="6 July 2026">
      <p><strong>TravelWell may earn a commission when you book travel through links we surface — at no extra cost to you.</strong> We want that to be clear and out in the open.</p>

      <h2>How it works</h2>
      <ul>
        <li>Atlas and our pages surface travel options that fit your trip.</li>
        <li>When you choose one, we hand you to the provider through a tracked link.</li>
        <li>You book and pay the provider <strong>directly</strong> — they are always the merchant of record.</li>
        <li>If a booking results, we may receive a referral commission from the provider or an affiliate network.</li>
      </ul>

      <h2>Our promise</h2>
      <p>Commission never buys placement. Options are ranked by how well they fit <em>you</em> — your interests, your trip, your budget — not by which pays us most. We show the field straight, including strong options we don't earn on, and we never take your payment or hold your card details.</p>

      <h2>Who we work with</h2>
      <p>We partner with travel providers directly and through affiliate networks (such as CJ, AWIN, and Travelpayouts) to make booking seamless. Where a link is monetized, this disclosure applies.</p>

      <p>Questions about how we earn? <Link to="/contact">Ask us anything</Link>.</p>
    </LegalLayout>
  );
}
