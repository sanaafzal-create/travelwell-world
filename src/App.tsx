import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Shell } from "@/components/shell/Shell";
import { useCatalog } from "@/store/useCatalog";
import Home from "@/pages/Home";
import SpecialInterests from "@/pages/SpecialInterests";
import SiDetail from "@/pages/SiDetail";
import Regions from "@/pages/Regions";
import RegionDetail from "@/pages/RegionDetail";
import Activities from "@/pages/Activities";
import WellsSurface from "@/pages/WellsSurface";
import Wells from "@/pages/Wells";
import Providers from "@/pages/Providers";
import Destinations from "@/pages/Destinations";
import DestinationDetail from "@/pages/DestinationDetail";
import Itinerary from "@/pages/Itinerary";
import Luxury from "@/pages/Luxury";
import Guides from "@/pages/Guides";
import GuideDetail from "@/pages/GuideDetail";
import FirstAidKit from "@/pages/FirstAidKit";
import Demo from "@/pages/Demo";
import SignUp from "@/pages/SignUp";
import SignIn from "@/pages/SignIn";
import VerifyEmail from "@/pages/VerifyEmail";
import Activation from "@/pages/Activation";
import Profile from "@/pages/Profile";
import Plan from "@/pages/Plan";
import About from "@/pages/About";
import Sitemap from "@/pages/Sitemap";
import Go from "@/pages/Go";
import { Placeholder } from "@/pages/Placeholder";

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
