import React, { useEffect, useMemo } from "react";
import { useApp, Mode } from "../context";
import { PATIENTS, getRepo } from "../lib/repo";
import { detectGaps } from "../lib/gaps";
import { ageOn, fmtDate, DEMO_TODAY } from "../lib/dates";
import { Logo } from "../components/Shell";
import { LandmarkArt, GapBadge, PALETTE as C } from "../components/Glyphs";
import { TYPE_META } from "../lib/landmarks";
import { IconArrowRight, IconUser, IconHospital, IconAlert, IconCalendar, IconShield, IconChevronDown } from "../components/icons";
import type { LandmarkType } from "../types";

const REPO_URL = "https://github.com/ArshadSohomow/pathways";

/** Decorative hero landscape: the brand illustration, not a patient record. */
function HeroLandscape() {
  // Landmarks sit to the right of the welcome card so the trail stays visible.
  const stops: { x: number; y: number; t: LandmarkType; v?: string; s: "completed" | "ongoing" | "upcoming" }[] = [
    { x: 770, y: 332, t: "signpost", s: "completed" },
    { x: 880, y: 300, t: "campsite", s: "completed" },
    { x: 985, y: 322, t: "bridge", s: "ongoing" },
    { x: 1095, y: 282, t: "viewpoint", s: "upcoming" },
  ];
  const trail = "M-20,392 C220,388 480,372 640,356 S730,332 770,332 S840,300 880,300 S945,322 985,322 S1055,282 1095,282 S1180,262 1240,254";
  return (
    <svg className="hero__art" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="h-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E3F0EC" /><stop offset=".6" stopColor="#F5F8EC" /><stop offset="1" stopColor="#FBF6E3" /></linearGradient>
        <radialGradient id="h-glow"><stop offset="0" stopColor={C.sun} stopOpacity=".6" /><stop offset="1" stopColor={C.sun} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1200" height="420" fill="url(#h-sky)" />
      <circle cx="1010" cy="96" r="120" fill="url(#h-glow)" />
      <circle cx="1010" cy="96" r="38" fill={C.sun} />
      <g fill="#fff" opacity=".85"><ellipse cx="250" cy="70" rx="46" ry="12" /><ellipse cx="232" cy="60" rx="22" ry="13" /><ellipse cx="268" cy="58" rx="24" ry="15" /><ellipse cx="720" cy="48" rx="38" ry="10" /><ellipse cx="740" cy="40" rx="20" ry="12" /></g>
      <path d="M0 230 L90 140 L160 190 L260 90 L360 180 L450 120 L560 200 L660 110 L760 175 L860 95 L960 170 L1060 130 L1200 200 V420 H0Z" fill="#C9DDD3" />
      <path d="M0 250 L120 180 L210 225 L320 160 L430 230 L540 175 L650 235 L770 170 L880 225 L990 185 L1100 230 L1200 205 V420 H0Z" fill="#B3CFC0" />
      <path d="M0 262 C150 240 260 270 400 255 S650 236 800 252 S1050 270 1200 248 V420 H0Z" fill="#CFE2C9" />
      {[40, 75, 300, 335, 500, 640, 1150, 1185].map((x, i) => (
        <g key={i} transform={`translate(${x} ${262 - (i % 3) * 4}) scale(${0.55 + (i % 2) * 0.15})`} fill="#5E8C72"><path d="M0-42 10-24H5l9 14H-14l9-14h-5z" /><path d="M0-30 12-4H-12z" /></g>
      ))}
      <path d="M0 300 C200 285 330 310 520 298 S860 286 1000 300 S1150 310 1200 296 V420 H0Z" fill="#DAE9D3" />
      <path d="M0 360 C220 350 420 368 640 356 S1000 348 1200 360 V420 H0Z" fill="#E1EDD9" />
      <path d={trail} stroke="#EFE3C8" strokeWidth="18" fill="none" strokeLinecap="round" />
      <path d={trail} stroke="#B49F79" strokeWidth="2.4" fill="none" strokeDasharray="7 6" strokeLinecap="round" />
      {stops.map((s, i) => (
        <g key={i} transform={`translate(${s.x - 30} ${s.y - 30}) scale(.94)`}>
          <circle cx="32" cy="32" r="29" fill={s.s === "upcoming" ? "#fff" : s.s === "ongoing" ? "#fff" : C.mint} stroke={s.s === "ongoing" ? C.teal : s.s === "upcoming" ? C.grey : C.forest} strokeWidth="2.5" strokeDasharray={s.s === "upcoming" ? "5 4" : undefined} />
          <LandmarkArt type={s.t} variant={s.v} />
        </g>
      ))}
      <g transform="translate(1030 258)">
        <circle cx="13" cy="5" r="3.6" fill={C.text} />
        <path d="M10.5 10.5c2.6-1 5.2-.4 6 1.8l1.6 7.6-2.6.6-1.3-4.7-.9 6.9 3.9 8.4-2.7 1.3-4.4-8.6-2.8 9.6-2.9-.7 3.7-14.3.4-3.5-2 3.2-2.4-1.3 3.2-5.6c.6-.9 1.3-.9 3.2-1z" fill={C.text} />
        <path d="M19.3 15.5 22 40" stroke="#5F4A30" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {[[60, 392], [180, 404], [330, 388], [470, 400], [610, 392], [880, 398], [1020, 388], [1150, 402]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={i % 2 ? "#fff" : C.sun} stroke="#B9C9A8" strokeWidth=".6" />)}
      {[120, 1180].map((x, i) => (
        <g key={i} transform={`translate(${x} 410) scale(1.5)`} fill={C.forest}><path d="M0-42 10-24H5l9 14H-14l9-14h-5z" /><path d="M0-30 12-4H-12z" /></g>
      ))}
    </svg>
  );
}

function PatientCard({ id }: { id: string }) {
  const { enter } = useApp();
  const repo = getRepo(id);
  const p = repo.patient;
  const stats = useMemo(() => {
    const ds = repo.ds;
    return {
      events: ds.events.length,
      orgs: ds.organisations.length,
      gaps: detectGaps(repo).length,
      next: ds.appointments.filter((a) => a.status === "Scheduled" && a.scheduledAt.slice(0, 10) > DEMO_TODAY).sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : 1))[0],
      tags: [
        ds.episodes.some((e) => e.episodeKind === "Inpatient") && "Hospital stay",
        ds.organisations.some((o) => o.sector === "Overseas") && "Overseas care",
        ds.organisations.some((o) => o.sector === "Private") && "Private care",
        ds.branches.length > 2 && "Branching pathways",
        ds.medications.some((m) => m.status === "Awaiting reconciliation") && "Medication discrepancy",
      ].filter(Boolean) as string[],
    };
  }, [repo]);
  const initials = p.displayName.split(" ").map((x) => x[0]).join("");
  const go = (m: Mode) => enter(m, id);
  return (
    <article className="pcard" aria-labelledby={`pc-${id}`}>
      <div className="pcard__top">
        <span className="pcard__avatar" aria-hidden="true">{initials}</span>
        <div>
          <h3 className="pcard__name" id={`pc-${id}`}>{p.displayName}</h3>
          <p className="pcard__meta">{ageOn(p.dateOfBirth)} years · fictional patient</p>
        </div>
      </div>
      <p className="pcard__teaser">{p.demoTeaser}</p>
      <ul className="pcard__tags" aria-label="Journey features">{stats.tags.map((t) => <li key={t}>{t}</li>)}</ul>
      <dl className="pcard__stats">
        <div><dt>Events</dt><dd>{stats.events}</dd></div>
        <div><dt>Organisations</dt><dd>{stats.orgs}</dd></div>
        <div><dt>Information gaps</dt><dd>{stats.gaps}</dd></div>
      </dl>
      {stats.next && <p className="pcard__next small"><IconCalendar size={14} /> Next booked: {fmtDate(stats.next.scheduledAt)}</p>}
      <div className="pcard__actions">
        <button type="button" className="btn" onClick={() => go("patient")} aria-label={`Open ${p.displayName}'s journey in the patient view`}>Patient view <IconArrowRight size={16} /></button>
        <button type="button" className="btn btn--ghost" onClick={() => go("pro")} aria-label={`Open ${p.displayName}'s journey in the professional view`}>Professional view <IconArrowRight size={16} /></button>
      </div>
    </article>
  );
}

export function Home() {
  useEffect(() => { document.title = "Pathways — every step of your healthcare journey, connected (demo)"; document.getElementById("home-title")?.focus({ preventScroll: true }); }, []);
  const types: LandmarkType[] = ["signpost", "campsite", "bridge", "viewpoint", "marker"];
  const toJourneys = () => document.getElementById("journeys")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return (
    <div className="home">
      <a className="skip" href="#home-main">Skip to content</a>
      <div className="demobar" role="note"><strong>Demonstration only.</strong> Fictional patients and synthetic records. Not an NHS service. No real data is collected or connected.</div>
      <header className="home__bar">
        <a href="#/" className="brand"><Logo /><span className="brand__name">Pathways</span></a>
        <nav aria-label="Site" className="home__nav">
          <a href="#journeys" onClick={(e) => { e.preventDefault(); toJourneys(); }}>Demo journeys</a>
          <a href="#how" onClick={(e) => { e.preventDefault(); document.getElementById("how")?.scrollIntoView(); }}>How it works</a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
      </header>

      <main id="home-main">
        <section className="hero" aria-labelledby="home-title">
          <HeroLandscape />
          <div className="hero__copy">
            <p className="hero__kicker">A healthcare journey prototype</p>
            <h1 className="hero__title" id="home-title" tabIndex={-1}>Every step of your healthcare journey, connected.</h1>
            <p className="hero__lede">Pathways turns scattered records from GPs, hospitals, community teams, private clinics and care abroad into one clear trail — so patients can see where they've been and what happens next, and professionals can see where care was handed over, and where the record goes quiet.</p>
            <div className="hero__cta">
              <button type="button" className="btn btn--lg" onClick={toJourneys}>Choose a demo journey <IconChevronDown size={18} /></button>
            </div>
          </div>
        </section>

        <section className="hsec" id="journeys" aria-labelledby="journeys-title">
          <div className="hsec__head">
            <h2 className="hsec__title" id="journeys-title">Choose a demo journey</h2>
            <p className="hsec__intro">Three fictional people, each with a complete synthetic record. Open any of them as the patient would see it, or as a healthcare professional coordinating their care. You can switch views and patients at any time.</p>
          </div>
          <div className="pcards">{PATIENTS.map((p) => <PatientCard key={p.id} id={p.id} />)}</div>
        </section>

        <section className="hsec hsec--tint" aria-labelledby="views-title">
          <div className="hsec__head"><h2 className="hsec__title" id="views-title">Two views of the same record</h2></div>
          <div className="views">
            <div className="view">
              <span className="view__icon" aria-hidden="true"><IconUser size={22} /></span>
              <h3>Patient view — My Journey</h3>
              <p>Plain language, a calm overview of where things stand, the next booked appointment, the teams involved and honest notes about anything the records don't show.</p>
            </div>
            <div className="view">
              <span className="view__icon view__icon--pro" aria-hidden="true"><IconHospital size={22} /></span>
              <h3>Professional view — Care Coordination</h3>
              <p>Referral tracking, encounters and admissions, medication reconciliation, record provenance, an audit trail, and transparent rules that flag information gaps for review.</p>
            </div>
          </div>
          <p className="small muted views__note">The switch between views is a demonstration feature. It is not a log-in and does not enforce any permissions.</p>
        </section>

        <section className="hsec" id="how" aria-labelledby="how-title">
          <div className="hsec__head">
            <h2 className="hsec__title" id="how-title">How to read the trail</h2>
            <p className="hsec__intro">Every landmark is a real, selectable record. The illustration gives the shape of the journey; the timeline and record views give the precision.</p>
          </div>
          <ul className="legendgrid">
            {types.map((t) => (
              <li key={t}>
                <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill={C.mint} /><LandmarkArt type={t} /></svg>
                <div><strong>{TYPE_META[t].label}</strong><span>{TYPE_META[t].plainMeaning}</span></div>
              </li>
            ))}
            <li>
              <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#FFF8E1" /><GapBadge x={32} y={34} /></svg>
              <div><strong>Information gap</strong><span>Something is missing or unclear in the records — never a judgement about care</span></div>
            </li>
          </ul>
        </section>

        <section className="hsec hsec--tint" aria-labelledby="principles-title">
          <div className="hsec__head"><h2 className="hsec__title" id="principles-title">Built on a few firm rules</h2></div>
          <div className="principles">
            <div><IconCalendar size={20} /><h3>Every date comes from the record</h3><p>Durations are calculated, never typed in. Ongoing care has no invented end date; a missing date means an honest "unknown".</p></div>
            <div><IconAlert size={20} /><h3>Gaps are explained, not hidden</h3><p>Twelve deterministic rules flag missing outcomes, unreceived referrals and conflicting records — each one traceable to its source.</p></div>
            <div><IconShield size={20} /><h3>Accessible by design</h3><p>Keyboard navigation, screen-reader descriptions, a full list alternative to the illustration and a dedicated phone layout.</p></div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <Logo size={22} />
        <span>Pathways — a service-design prototype. All people, organisations, identifiers and contact details are fictional. Not affiliated with the NHS. <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Source on GitHub</a>.</span>
      </footer>
    </div>
  );
}
