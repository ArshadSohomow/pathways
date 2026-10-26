import React from "react";
import { useApp, PanelRef } from "../context";
import { IconAlert, IconCheck, IconClock, IconInfo, IconChevronRight, IconCalendar, IconX, IconGlobe, IconBuilding } from "./icons";
import type { LandmarkStatus } from "../lib/landmarks";
import { STATUS_META } from "../lib/landmarks";
import type { GapFinding } from "../lib/gaps";
import { fmtDate, fmtDateTime } from "../lib/dates";

export type Tone = "ok" | "info" | "attention" | "neutral" | "error" | "upcoming";

const TONE_ICON: Record<Tone, (p: { size?: number }) => JSX.Element> = {
  ok: IconCheck, info: IconClock, attention: IconAlert, neutral: IconInfo, error: IconAlert, upcoming: IconCalendar,
};

export function toneFor(status: string): Tone {
  const s = status.toLowerCase();
  if (["completed", "attended", "closed", "assessment completed", "active", "verified", "available", "handover received", "handover recorded", "completed course"].includes(s)) return "ok";
  if (["scheduled", "booked", "upcoming", "planned"].includes(s)) return "upcoming";
  if (["ongoing", "accepted", "appointment scheduled", "current", "open", "changed"].includes(s)) return "info";
  if (["awaiting update", "awaiting review", "received", "sent", "awaiting reconciliation", "no completion recorded", "receipt not recorded", "partially available", "partially verified", "unverified", "referred, not yet involved", "referenced, not received"].includes(s)) return "attention";
  if (["conflict", "error"].includes(s)) return "error";
  return "neutral";
}

export function StatusPill({ status, tone, label, size = "md" }: { status?: string; tone?: Tone; label?: string; size?: "sm" | "md" }) {
  const t = tone ?? toneFor(status ?? "");
  const Icon = TONE_ICON[t];
  return (
    <span className={`pill pill--${t} pill--${size}`}>
      <Icon size={size === "sm" ? 12 : 14} />
      <span>{label ?? status}</span>
    </span>
  );
}

export function LandmarkStatusPill({ status, label }: { status: LandmarkStatus; label?: string }) {
  const { mode } = useApp();
  const tone: Tone = { completed: "ok", ongoing: "info", upcoming: "upcoming", awaiting: "attention", "not-recorded": "neutral", cancelled: "neutral" }[status] as Tone;
  return <StatusPill tone={tone} label={label ?? (mode === "patient" ? STATUS_META[status].patientLabel : STATUS_META[status].label)} />;
}

export function RecordLink({ to, children, className = "" }: { to: PanelRef; children: React.ReactNode; className?: string }) {
  const { open } = useApp();
  return (
    <button type="button" className={`linkbtn ${className}`} onClick={() => open(to)}>
      {children}
    </button>
  );
}

export function Card({ title, icon, children, action, className = "", headingLevel = 2, id }: { title?: React.ReactNode; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode; className?: string; headingLevel?: 2 | 3; id?: string }) {
  const H = `h${headingLevel}` as "h2";
  return (
    <section className={`card ${className}`} aria-labelledby={id}>
      {title && (
        <div className="card__head">
          <H className="card__title" id={id}>{icon}{title}</H>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="empty" role="status">
      <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden="true"><path d="M2 36c10-8 18-2 28-10s18-14 32-12" stroke="#C8B69A" strokeWidth="3" fill="none" strokeDasharray="4 5" strokeLinecap="round" /><circle cx="54" cy="10" r="6" fill="#F2D77A" /></svg>
      <p className="empty__title">{title}</p>
      {children && <div className="empty__body">{children}</div>}
      {action}
    </div>
  );
}

export function KV({ items }: { items: [React.ReactNode, React.ReactNode | undefined | null][] }) {
  return (
    <dl className="kv">
      {items.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v], i) => (
        <div className="kv__row" key={i}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}

export function SectorTag({ sector, jurisdiction }: { sector: "NHS" | "Private" | "Overseas"; jurisdiction?: string }) {
  return (
    <span className={`tag tag--${sector.toLowerCase()}`}>
      {sector === "Overseas" ? <IconGlobe size={12} /> : <IconBuilding size={12} />}
      {sector === "NHS" ? "NHS (synthetic)" : sector}{sector === "Overseas" && jurisdiction ? ` · ${jurisdiction}` : ""}
    </span>
  );
}

export function GapCallout({ gap, compact }: { gap: GapFinding; compact?: boolean }) {
  const { mode, open } = useApp();
  return (
    <div className={`gap gap--${gap.category === "Information incomplete" ? "info" : gap.category === "Review recommended" ? "review" : "coord"}`}>
      <div className="gap__icon" aria-hidden="true"><IconAlert size={16} /></div>
      <div className="gap__body">
        {mode === "pro" && <span className="gap__cat">{gap.category} · Rule {gap.ruleId}</span>}
        <p className="gap__title">{mode === "patient" ? gap.plainTitle : gap.title}</p>
        {!compact && <p className="gap__text">{mode === "patient" ? gap.plainExplanation : gap.whatFound}</p>}
        <button type="button" className="linkbtn linkbtn--sm" onClick={() => open({ kind: "gap", id: gap.id })}>
          {mode === "patient" ? "What this means" : "Review finding"} <IconChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function DateText({ d, withTime = true }: { d?: string; withTime?: boolean }) {
  if (!d) return <span className="muted">Not recorded</span>;
  return <time dateTime={d}>{withTime ? fmtDateTime(d) : fmtDate(d)}</time>;
}

export function PageHeader({ title, intro, children }: { title: string; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="pagehead">
      <div>
        <h1 className="pagehead__title" id="page-title" tabIndex={-1}>{title}</h1>
        {intro && <p className="pagehead__intro">{intro}</p>}
      </div>
      {children && <div className="pagehead__actions">{children}</div>}
    </header>
  );
}

export function Chip({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span className="chip">
      {children}
      {onRemove && <button type="button" className="chip__x" onClick={onRemove} aria-label={`Remove filter: ${typeof children === "string" ? children : ""}`}><IconX size={12} /></button>}
    </span>
  );
}

export function Toggle({ pressed, onChange, children }: { pressed: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`toggle ${pressed ? "is-on" : ""}`} aria-pressed={pressed} onClick={() => onChange(!pressed)}>
      <span className="toggle__box" aria-hidden="true">{pressed && <IconCheck size={12} />}</span>
      {children}
    </button>
  );
}
