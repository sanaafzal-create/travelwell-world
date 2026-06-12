import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Order matters: Tailwind preflight first, then the settled design system,
// then the per-area stylesheets that compose on top of the tokens.
import "./index.css";
import "./styles/tokens.css";
import "./styles/shell.css";
import "./styles/journey.css";
import "./styles/wells.css";
import "./styles/itinerary.css";
import "./styles/checkout.css";
import "./styles/onboarding.css";
import "./styles/profile.css";
import "./styles/luxury.css";
import "./styles/investor.css";
import "./styles/pages.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
