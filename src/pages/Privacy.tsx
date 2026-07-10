import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/ui/LegalLayout";

// NOTE: A plain-language privacy policy tailored to what TravelWell actually
// collects. It is accurate to our real data practices, but it is not legal advice
// — have counsel review before relying on it.
export default function Privacy() {
  return (
    <LegalLayout eyebrow="Legal" title="Privacy Policy" updated="6 July 2026">
      <p>TravelWell.World ("TravelWell," "we," "us") helps you discover, plan, and organize travel. This policy explains what we collect, why, and the choices you have. We keep it plain on purpose.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account</strong> — your email address, used to sign you in by a secure magic link.</li>
        <li><strong>Your Travel ID</strong> — the details you choose to share as you plan: a display name, an <em>age range</em> (never a date of birth), your travel interests and budget ranges, your saved trip, and the first names of anyone you add to your party.</li>
        <li><strong>How you use TravelWell</strong> — the pages and options you explore, so we can match you to travel that actually fits.</li>
        <li><strong>Preferences</strong> — your language, consent choices, and your in-progress trip, saved in your browser so your journey carries over between visits.</li>
      </ul>

      <h2>What we never collect</h2>
      <p><strong>Payment or card details — ever.</strong> When you book, you book and pay the provider directly on their own site; TravelWell is not the merchant and never sees, holds, or stores your payment information. See our <Link to="/disclosure">Affiliate Disclosure</Link>.</p>

      <h2>Cookies &amp; local storage</h2>
      <p>We use essential browser storage to remember your trip, language, and consent choice — so the experience works and your plan isn't lost. You'll see a short consent notice on your first visit.</p>

      <h2>Who helps us run TravelWell</h2>
      <p>We rely on a small set of trusted services: a database and authentication provider, our hosting provider, an image service, and the Atlas assistant (AI) that helps you plan. When — and only when — you choose to book, we hand you to the travel provider through a tracked link so the referral is credited. We never sell your personal data.</p>

      <h2>Your choices</h2>
      <p>You can view, update, or delete your Travel ID at any time, and adjust your consent preferences in your profile. To make a privacy request or ask a question, <Link to="/contact">contact us</Link>.</p>

      <h2>Children</h2>
      <p>TravelWell isn't directed at children. Where you plan family travel, only a child's first name is used, and only to help organize your trip.</p>

      <h2>Changes</h2>
      <p>If this policy changes, we'll update the date above and, for material changes, let you know in the product.</p>
    </LegalLayout>
  );
}
