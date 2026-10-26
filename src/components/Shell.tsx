import React, { useEffect, useRef, useState } from "react";
import { useApp, PATIENT_PAGES, PRO_PAGES, Mode } from "../context";
import { PATIENTS } from "../lib/repo";
import { globalSearch, SearchResult } from "../lib/filters";
import { fmtDate, ageOn, fmtDateTime, DEMO_TODAY } from "../lib/dates";
import { IconHome, IconMap, IconCalendar, IconPill, IconUsers, IconFile, IconUser, IconSearch, IconX, IconFlag, IconHospital, IconShield, IconLink, IconMenu, IconDatabase } from "./icons";

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#EAF3E8" />
      <circle cx="27.5" cy="12.5" r="4.2" fill="#F2D77A" />
      <path d="M3.5 28 13 15.5l5 6 5.5-8L36.5 28" fill="none" stroke="#285B46" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M11 37c2-4 9-3.5 10.5-7.5S19 24 24 22.5" fill="none" stroke="#287D78" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="22.5" r="1.8" fill="#287D78" />
    </svg>
  );
}

const ICONS: Record<string, (p: { size?: number }) => JSX.Element> = {
  overview: IconHome, journey: IconMap, appointments: IconCalendar, medications: IconPill, teams: IconUsers, documents: IconFile, details: IconUser,
  referrals: IconLink, encounters: IconHospital, actions: IconFlag, records: IconDatabase, audit: IconShield,
};

function ModeSwitch() {
  const { mode, setMode } = useApp();
  return (
    <div className="modeswitch">
      <span className="modeswitch__label" id="mode-label">Demo view</span>
      <div className="seg seg--mode" role="radiogroup" aria-labelledby="mode-label">
        {(["patient", "pro"] as Mode[]).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "is-on" : ""} onClick={() => setMode(m)}>
            {m === "patient" ? "Patient view" : "Professional view"}
          </button>
        ))}
      </div>
    </div>
  );
}

function GlobalSearch() {
  const { repo, open, mode, setHighlight } = useApp();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const [show, setShow] = useState(false);
  const results = globalSearch(repo, q);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setShow(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  useEffect(() => setQ(""), [repo]);
  const choose = (r: SearchResult) => {
    setShow(false);
    if (r.kind === "event") {
      const lm = repo.landmarkForEvent(r.id);
      open({ kind: "event", id: r.id }, { replace: true });
      if (lm) setHighlight(lm.id);
    } else open({ kind: r.kind, id: r.id }, { replace: true });
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setShow(true); setActive((a) => Math.min(results.length - 1, a + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === "Enter" && active >= 0 && results[active]) { e.preventDefault(); choose(results[active]); }
    if (e.key === "Escape") { setShow(false); }
  };
  return (
    <div className="gsearch" ref={box}>
      <label className="search search--global">
        <IconSearch size={16} />
        <span className="sr-only">Search this record</span>
        <input
          type="search" value={q} placeholder={mode === "patient" ? "Search my records" : "Search events, referrals, medicines…"}
          role="combobox" aria-expanded={show && q.length >= 2} aria-controls="gsearch-list" aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `gs-${active}` : undefined}
          onChange={(e) => { setQ(e.target.value); setShow(true); setActive(-1); }} onFocus={() => setShow(true)} onKeyDown={onKey}
        />
        {q && <button type="button" className="iconbtn iconbtn--sm" onClick={() => setQ("")} aria-label="Clear search"><IconX size={14} /></button>}
      </label>
      {show && q.trim().length >= 2 && (
        <div className="gsearch__pop">
          <p className="gsearch__count" aria-live="polite">{results.length ? `${results.length} result${results.length > 1 ? "s" : ""}` : "No results"}</p>
          {results.length === 0 ? (
            <p className="gsearch__empty">Nothing in this record matches “{q}”. Try a service, medicine or provider name. <button type="button" className="linkbtn linkbtn--sm" onClick={() => setQ("")}>Clear search</button></p>
          ) : (
            <ul id="gsearch-list" role="listbox" aria-label="Search results">
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.id}`} id={`gs-${i}`} role="option" aria-selected={i === active} className={i === active ? "is-active" : ""} onMouseDown={(e) => { e.preventDefault(); choose(r); }}>
                  <span className="gsearch__title">{r.title}</span>
                  <span className="gsearch__meta">{r.date ? fmtDate(r.date) : "—"} · {r.typeLabel} · {r.provider}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { mode, page, go, repo, patientId, setPatient, gaps } = useApp();
  const p = repo.patient;
  const pages = mode === "pro" ? PRO_PAGES : PATIENT_PAGES;
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => setNavOpen(false), [page]);
  useEffect(() => { document.getElementById("page-title")?.focus({ preventScroll: true }); }, [page, mode]);
  useEffect(() => { document.title = `${pages.find((x) => x.key === page)?.label ?? ""} · ${p.displayName} · Pathways (demo)`; }, [page, p, pages]);
  return (
    <div className={`app app--${mode}`}>
      <a className="skip" href="#main">Skip to content</a>
      <div className="demobar" role="note">
        <strong>Demonstration only.</strong> Fictional patients and synthetic records. Not an NHS service. No real data is collected or connected.
      </div>
      <header className="topbar">
        <div className="topbar__brand">
          <button type="button" className="iconbtn navtoggle" aria-expanded={navOpen} aria-controls="sidenav" onClick={() => setNavOpen(!navOpen)} aria-label="Menu"><IconMenu size={20} /></button>
          <a href={`#/${mode}/${patientId}/overview`} className="brand"><Logo /><span className="brand__name">Pathways</span></a>
          <span className="brand__sub">{mode === "pro" ? "Care Coordination" : "My Journey"}</span>
        </div>
        <GlobalSearch />
        <ModeSwitch />
      </header>
      <div className="idbar">
        <div className="idbar__who">
          <label className="field field--inline idbar__pick">
            <span className="field__label">Demo patient</span>
            <select value={patientId} onChange={(e) => setPatient(e.target.value)}>
              {PATIENTS.map((x) => <option key={x.id} value={x.id}>{x.displayName}</option>)}
            </select>
          </label>
          <div className="idbar__facts">
            <span><strong>{p.displayName}</strong></span>
            <span>Born {fmtDate(p.dateOfBirth)} ({ageOn(p.dateOfBirth)} years)</span>
            {mode === "pro" && p.demonstrationIdentifiers.map((d) => <span key={d.label}>{d.label}: <code>{d.value}</code></span>)}
          </div>
        </div>
        <div className="idbar__fresh">
          <span className="pill pill--synthetic pill--sm">Synthetic data</span>
          <span className="small">Records updated {fmtDateTime(p.recordUpdatedAt)} · demo date {fmtDate(DEMO_TODAY)}</span>
        </div>
      </div>
      <div className="layout">
        <nav id="sidenav" className={`sidenav ${navOpen ? "is-open" : ""}`} aria-label={mode === "pro" ? "Care coordination" : "My Journey"}>
          <ul>
            {pages.map((pg) => {
              const Icon = ICONS[pg.key];
              const badge = pg.key === "actions" ? gaps.length : undefined;
              return (
                <li key={pg.key}>
                  <a href={`#/${mode}/${patientId}/${pg.key}`} aria-current={page === pg.key ? "page" : undefined} className={page === pg.key ? "is-active" : ""} onClick={(e) => { e.preventDefault(); go(pg.key); }}>
                    <Icon size={18} /> <span>{pg.label}</span>
                    {badge ? <span className="navbadge" aria-label={`${badge} information gaps`}>{badge}</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="sidenav__note">The view switch is a demonstration feature. It is not a log-in and does not enforce any permissions.</p>
        </nav>
        <main id="main" className="main" tabIndex={-1}>{children}</main>
      </div>
      <footer className="foot">
        <Logo size={22} />
        <span>Pathways — a service-design prototype. All people, organisations, identifiers and contact details are fictional. Not affiliated with the NHS.</span>
      </footer>
    </div>
  );
}
