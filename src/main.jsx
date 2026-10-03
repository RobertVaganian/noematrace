import React, { lazy, Suspense } from "react";
import { appRoute } from "./paths.js";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/geist";
import "./case-study.css";
import "./styles.css";
import "./theme.css";
import "./polish.css";
import "./review-polish.css";
import "./workspace-refinement.css";
import "./motion.css";
import { motionDisabled } from "./motion.js";
document.documentElement.dataset.motion = motionDisabled(location.search, false) ? "off" : "on";
import { ThemeProvider } from "./Theme.jsx";
const App = lazy(() =>
  import("./App.jsx").then((module) => ({ default: module.App })),
);
const CaseStudy = lazy(() =>
  import("./CaseStudy.jsx").then((module) => ({ default: module.CaseStudy })),
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <Suspense fallback={
        <main className="app-loading" role="status">Opening NoemaTrace…</main>
      }>
        {appRoute(location.pathname) === "/case-study" ? (
          <CaseStudy />
        ) : (
          <App />
        )}
      </Suspense>
    </ThemeProvider>
  </React.StrictMode>,
);
