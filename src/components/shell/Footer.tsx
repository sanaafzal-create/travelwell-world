import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="tw-footer">
      <div className="tw-footer__inner">
        <div className="tw-footer__top">
          <div className="tw-footer__brand">
            <Link className="tw-logo" to="/">Travel<span className="lwell">Well</span><span className="lworld">.world</span></Link>
            <p className="tw-footer__sig">If it's a once-in-a-lifetime journey… <span className="tw">Travel Well.</span></p>
          </div>
          <div className="tw-footer__col">
            <h5>The System</h5>
            <Link to="/about">About / Architecture</Link>
            <Link to="/special-interests">25 Special Interests</Link>
            <Link to="/regions">13 Regions</Link>
            <Link to="/wells">10 Wells</Link>
            <Link to="/providers">200+ Providers</Link>
          </div>
          <div className="tw-footer__col">
            <h5>Journeys</h5>
            <Link to="/plan">Plan Your Trip</Link>
            <Link to="/guides">Travel Guides</Link>
            <Link to="/luxury">Luxury Worlds</Link>
            <Link to="/destinations">Destinations</Link>
            <Link to="/itinerary">Your Itinerary</Link>
          </div>
          <div className="tw-footer__col">
            <h5>Partners &amp; Proof</h5>
            <Link to="/demo">Public Demo</Link>
            <Link to="/vc-demo">VC Demo</Link>
            <Link to="/first-aid-kit">First Aid Kit</Link>
            <Link to="/sitemap">Sitemap</Link>
            <Link to="/disclosure">Affiliate Disclosure</Link>
          </div>
          <div className="tw-footer__col">
            <h5>Company</h5>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
        <div className="tw-footer__bottom">
          <span>© 2026 TravelWell.World — every link disclosed, every fact real.</span>
          <span className="tw-footer__legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/disclosure">Disclosure</Link>
            <Link to="/contact">Contact</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
