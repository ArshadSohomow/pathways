import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider, useApp } from "./context";
import { Shell } from "./components/Shell";
import { DetailPanel } from "./components/DetailPanel";
import { Overview } from "./pages/Overview";
import { Home } from "./pages/Home";
import { Journey, Appointments, Encounters, Referrals, Medications, Teams, Documents, Records, Details, Actions, Audit } from "./pages/Pages";
import "./styles.css";

const PAGES: Record<string, () => JSX.Element> = {
  overview: Overview, journey: Journey, appointments: Appointments, encounters: Encounters, referrals: Referrals,
  medications: Medications, teams: Teams, documents: Documents, records: Records, details: Details, actions: Actions, audit: Audit,
};

function Router() {
  const { page, mode, patientId, home } = useApp();
  if (home) return <Home />;
  const Page = PAGES[page] ?? Overview;
  return (
    <Shell>
      <Page key={`${mode}-${patientId}-${page}`} />
      <DetailPanel />
    </Shell>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <Router />
    </AppProvider>
  </React.StrictMode>,
);
