import { Routes, Route } from "react-router-dom";
import { useEffect, lazy } from "react";
import { Shell } from "@/components/shell/Shell";
import { useCatalog } from "@/store/useCatalog";

// Pages are code-split: each becomes its own chunk, fetched on first visit.
// The Suspense boundary that covers these lives in Shell (around <Outlet/>).
const Home = lazy(() => import("@/pages/Home"));
const SpecialInterests = lazy(() => import("@/pages/SpecialInterests"));
const SiDetail = lazy(() => import("@/pages/SiDetail"));
const Regions = lazy(() => import("@/pages/Regions"));
const RegionDetail = lazy(() => import("@/pages/RegionDetail"));
const Activities = lazy(() => import("@/pages/Activities"));
const WellsSurface = lazy(() => import("@/pages/WellsSurface"));
const Wells = lazy(() => import("@/pages/Wells"));
const Providers = lazy(() => import("@/pages/Providers"));
const Destinations = lazy(() => import("@/pages/Destinations"));
const DestinationDetail = lazy(() => import("@/pages/DestinationDetail"));
const Itinerary = lazy(() => import("@/pages/Itinerary"));
const Luxury = lazy(() => import("@/pages/Luxury"));
const Guides = lazy(() => import("@/pages/Guides"));
const GuideDetail = lazy(() => import("@/pages/GuideDetail"));
const FirstAidKit = lazy(() => import("@/pages/FirstAidKit"));
const Demo = lazy(() => import("@/pages/Demo"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const Activation = lazy(() => import("@/pages/Activation"));
const Profile = lazy(() => import("@/pages/Profile"));
const Plan = lazy(() => import("@/pages/Plan"));
const About = lazy(() => import("@/pages/About"));
const Sitemap = lazy(() => import("@/pages/Sitemap"));
const Go = lazy(() => import("@/pages/Go"));
const Placeholder = lazy(() => import("@/pages/Placeholder").then((m) => ({ default: m.Placeholder })));

export default function App() {
  // Hydrate the catalog from Postgres once on boot. No-ops gracefully (keeps
  // the bundle) when Supabase isn't configured or is unreachable.
  const hydrate = useCatalog((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/guide/:id" element={<GuideDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/special-interests" element={<SpecialInterests />} />
        <Route path="/si/:id" element={<SiDetail />} />
        <Route path="/regions" element={<Regions />} />
        <Route path="/region/:code" element={<RegionDetail />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/wells" element={<Wells />} />
        <Route path="/wells-surface" element={<WellsSurface />} />
        <Route path="/well/:id" element={<WellsSurface />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/destination/:id" element={<DestinationDetail />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/luxury" element={<Luxury />} />
        <Route path="/first-aid-kit" element={<FirstAidKit />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/vc-demo" element={<Demo gated />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/activation" element={<Activation />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/sitemap" element={<Sitemap />} />
        <Route path="/go" element={<Go />} />
        <Route path="*" element={<Placeholder title="Not found" eyebrow="404" lead="That page wandered off the map. Let's get you back on the trail." />} />
      </Route>
    </Routes>
  );
}
