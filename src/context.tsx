import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getRepo, PATIENT_IDS, Repo } from "./lib/repo";
import { detectGaps, GapFinding } from "./lib/gaps";
import { buildLandmarks, LandmarkVM } from "./lib/landmarks";

export type Mode = "patient" | "pro";
export type PanelKind = "landmark" | "event" | "referral" | "medication" | "document" | "appointment" | "action" | "gap" | "source" | "episode" | "service" | "organisation";
export interface PanelRef { kind: PanelKind; id: string }

export const PATIENT_PAGES = [
  { key: "overview", label: "Overview" },
  { key: "journey", label: "My Journey" },
  { key: "appointments", label: "Appointments" },
  { key: "medications", label: "Medications" },
  { key: "teams", label: "Care Teams" },
  { key: "documents", label: "Documents" },
  { key: "details", label: "My Details" },
] as const;
export const PRO_PAGES = [
  { key: "overview", label: "Patient Overview" },
  { key: "journey", label: "Journey Explorer" },
  { key: "referrals", label: "Referrals" },
  { key: "encounters", label: "Encounters & Admissions" },
  { key: "medications", label: "Medications" },
  { key: "teams", label: "Teams & Services" },
  { key: "actions", label: "Outstanding Actions" },
  { key: "records", label: "Records & Documents" },
  { key: "audit", label: "Audit History" },
] as const;

interface Ctx {
  mode: Mode;
  patientId: string;
  page: string;
  repo: Repo;
  gaps: GapFinding[];
  landmarks: LandmarkVM[];
  panel: PanelRef[]; // stack; last is visible
  highlight: string | null; // landmark id highlighted on the landscape
  go: (page: string) => void;
  setMode: (m: Mode) => void;
  setPatient: (id: string) => void;
  open: (ref: PanelRef, opts?: { replace?: boolean }) => void;
  back: () => void;
  close: () => void;
  showOnJourney: (landmarkId: string) => void;
  setHighlight: (id: string | null) => void;
  t: (patientText: string | undefined, proText: string) => string; // pick wording by mode
}

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("no ctx");
  return c;
};

function parseHash(): { mode: Mode; patientId: string; page: string; lm: string | null } {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [path, query] = raw.split("?");
  const [m, p, pg] = path.split("/");
  const mode: Mode = m === "pro" ? "pro" : "patient";
  const patientId = PATIENT_IDS.includes(p) ? p : PATIENT_IDS[0];
  const pages = (mode === "pro" ? PRO_PAGES : PATIENT_PAGES).map((x) => x.key as string);
  const page = pages.includes(pg) ? pg : "overview";
  const lm = new URLSearchParams(query ?? "").get("lm");
  return { mode, patientId, page, lm };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState(parseHash);
  const [panel, setPanel] = useState<PanelRef[]>([]);
  const [highlight, setHighlight] = useState<string | null>(route.lm);

  useEffect(() => {
    const onHash = () => {
      const r = parseHash();
      setRoute(r);
      if (r.lm) setHighlight(r.lm);
    };
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) window.history.replaceState(null, "", `#/patient/${PATIENT_IDS[0]}/overview`);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Navigating to another page, view or patient closes any open detail panel.
  useEffect(() => { setPanel([]); }, [route.page, route.mode, route.patientId]);

  const repo = useMemo(() => getRepo(route.patientId), [route.patientId]);
  const gaps = useMemo(() => detectGaps(repo), [repo]);
  const landmarks = useMemo(() => buildLandmarks(repo, gaps), [repo, gaps]);

  const nav = useCallback((mode: Mode, patientId: string, page: string, lm?: string) => {
    window.location.hash = `#/${mode}/${patientId}/${page}${lm ? `?lm=${lm}` : ""}`;
  }, []);

  const go = useCallback((page: string) => { nav(route.mode, route.patientId, page); window.scrollTo({ top: 0 }); }, [nav, route]);
  const setMode = useCallback((m: Mode) => {
    const pages = (m === "pro" ? PRO_PAGES : PATIENT_PAGES).map((x) => x.key as string);
    nav(m, route.patientId, pages.includes(route.page) ? route.page : "overview");
  }, [nav, route]);
  const setPatient = useCallback((id: string) => { setPanel([]); setHighlight(null); nav(route.mode, id, route.page); }, [nav, route]);
  const open = useCallback((ref: PanelRef, opts?: { replace?: boolean }) => {
    setPanel((s) => (opts?.replace || s.length === 0 ? [ref] : [...s, ref]));
    if (ref.kind === "landmark") setHighlight(ref.id);
  }, []);
  const back = useCallback(() => setPanel((s) => s.slice(0, -1)), []);
  const close = useCallback(() => setPanel([]), []);
  const showOnJourney = useCallback((lmId: string) => {
    setPanel([]);
    setHighlight(lmId);
    nav(route.mode, route.patientId, "journey", lmId);
  }, [nav, route]);
  const t = useCallback((p: string | undefined, pro: string) => (route.mode === "patient" && p ? p : pro), [route.mode]);

  const value: Ctx = { ...route, repo, gaps, landmarks, panel, highlight, go, setMode, setPatient, open, back, close, showOnJourney, setHighlight, t };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
