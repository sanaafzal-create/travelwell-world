import { LegalLayout } from "@/components/ui/LegalLayout";

// NOTE: contact address is a placeholder — confirm the real inbox(es) before launch.
const EMAIL = "hello@travelwell.world";

export default function Contact() {
  return (
    <LegalLayout eyebrow="Get in touch" title="Contact">
      <p>We're TravelWell.World — a travel operating system that helps you go from a feeling to a beautifully organized trip. We'd love to hear from you.</p>

      <h2>Email</h2>
      <p><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>

      <h2>What to reach us about</h2>
      <ul>
        <li><strong>Travelers</strong> — questions about planning a trip, your Travel ID, or a booking handoff.</li>
        <li><strong>Privacy</strong> — access, update, or delete your data (see our <a href="/privacy">Privacy Policy</a>).</li>
        <li><strong>Providers &amp; partners</strong> — to be featured or to discuss an affiliate or supply relationship.</li>
        <li><strong>Press &amp; investors</strong> — we're happy to talk.</li>
      </ul>

      <p>We read everything and reply as quickly as we can.</p>
    </LegalLayout>
  );
}
