import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context";
import { filterEvents, TimelineFilters, EMPTY_TIMELINE_FILTERS, countActiveTimelineFilters } from "../lib/filters";
import { fmtDate, fmtTime, fmtMonthYear, datePart } from "../lib/dates";
import { StatusPill, EmptyState, Toggle, SectorTag, Chip } from "./common";
import { IconSearch, IconReset, IconChevronDown, IconChevronRight, IconMap, IconFilter, IconAlert } from "./icons";
import type { EventType, EventStatus, HealthcareEvent } from "../types";

const ALL_TYPES: EventType[] = ["GP consultation", "Ambulance attendance", "Emergency department presentation", "Referral", "Triage", "Assessment", "Outpatient appointment", "Medication change", "Diagnostic test", "Procedure", "Review", "Admission", "Ward transfer", "Discharge", "Community contact", "Private consultation", "Overseas consultation", "Follow-up appointment", "Document imported"];

function MultiSelect<T extends string>({ label, options, value, onChange, render }: { label: string; options: T[]; value: T[]; onChange: (v: T[]) => void; render?: (o: T) => string }) {
  const [open, setOpen] = useState(false);
  const id = `ms-${label.replace(/\W/g, "")}`;
  return (
    <div className="ms">
      <button type="button" className={`btn btn--ghost ms__btn ${value.length ? "has-value" : ""}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {label}{value.length ? ` (${value.length})` : ""} <IconChevronDown size={14} />
      </button>
      {open && (
        <fieldset className="ms__pop" id={id}>
          <legend className="sr-only">{label}</legend>
          {options.map((o) => (
            <label key={o} className="ms__opt">
              <input type="checkbox" checked={value.includes(o)} onChange={(e) => onChange(e.target.checked ? [...value, o] : value.filter((x) => x !== o))} />
              {render ? render(o) : o}
            </label>
          ))}
          <div className="ms__foot">
            <button type="button" className="linkbtn linkbtn--sm" onClick={() => onChange([])}>Clear</button>
            <button type="button" className="btn btn--sm" onClick={() => setOpen(false)}>Done</button>
          </div>
        </fieldset>
      )}
    </div>
  );
}

export function Timeline({ initial, headingLevel = 2 }: { initial?: Partial<TimelineFilters>; headingLevel?: 2 | 3 }) {
  const { repo, mode, open, gaps, landmarks, showOnJourney, patientId } = useApp();
  const [f, setF] = useState<TimelineFilters>({ ...EMPTY_TIMELINE_FILTERS, ...initial });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  useEffect(() => { setF({ ...EMPTY_TIMELINE_FILTERS, ...initial }); setExpanded(new Set()); }, [patientId]);
  const events = useMemo(() => filterEvents(repo, f), [repo, f]);
  const types = ALL_TYPES.filter((t) => repo.ds.events.some((e) => e.eventType === t));
  const statuses = [...new Set(repo.ds.events.map((e) => e.status))] as EventStatus[];
  const orgs = repo.ds.organisations.filter((o) => repo.ds.events.some((e) => e.organisationId === o.id));
  const svcs = repo.ds.services.filter((s) => repo.ds.events.some((e) => e.serviceId === s.id));
  const n = countActiveTimelineFilters(f);
  const set = <K extends keyof TimelineFilters>(k: K, v: TimelineFilters[K]) => setF({ ...f, [k]: v });
  const gapEventIds = new Set(gaps.flatMap((g) => g.refs.filter((r) => r.kind === "event").map((r) => r.id)));
  const H = `h${headingLevel}` as "h2";

  // group by month
  const groups: { key: string; items: HealthcareEvent[] }[] = [];
  for (const e of events) {
    const k = fmtMonthYear(e.occurredAt);
    if (!groups.length || groups[groups.length - 1].key !== k) groups.push({ key: k, items: [] });
    groups[groups.length - 1].items.push(e);
  }
  const toggle = (id: string) => setExpanded((s) => { const n2 = new Set(s); n2.has(id) ? n2.delete(id) : n2.add(id); return n2; });

  return (
    <section className="timeline" aria-labelledby="tl-title">
      <div className="timeline__head">
        <H id="tl-title" className="section-title">Chronological timeline</H>
        <p className="muted small">{mode === "patient" ? "Every recorded event, in date order. Events from other countries appear on the date they happened, with the date they were added shown in the details." : "All events from all sources, ordered by event date (not import date)."}</p>
      </div>
      <div className="tfilters" role="search" aria-label="Filter the timeline">
        <label className="search">
          <IconSearch size={16} />
          <span className="sr-only">Search events</span>
          <input type="search" placeholder="Search events, services, providers…" value={f.q} onChange={(e) => set("q", e.target.value)} />
        </label>
        <label className="field field--inline"><span className="field__label">From</span><input type="date" value={f.from ?? ""} onChange={(e) => set("from", e.target.value || undefined)} /></label>
        <label className="field field--inline"><span className="field__label">To</span><input type="date" value={f.to ?? ""} onChange={(e) => set("to", e.target.value || undefined)} /></label>
        <MultiSelect label="Event type" options={types} value={f.types} onChange={(v) => set("types", v)} />
        <MultiSelect label="Organisation" options={orgs.map((o) => o.id)} value={f.organisationIds} onChange={(v) => set("organisationIds", v)} render={(o) => repo.orgName(o)} />
        <MultiSelect label="Service" options={svcs.map((s) => s.id)} value={f.serviceIds} onChange={(v) => set("serviceIds", v)} render={(s) => `${repo.svcName(s)} (${repo.svcOrg(s)?.name})`} />
        <MultiSelect label="Status" options={statuses} value={f.statuses} onChange={(v) => set("statuses", v)} />
        <Toggle pressed={f.significantOnly} onChange={(v) => set("significantOnly", v)}>Significant only</Toggle>
        <label className="field field--inline"><span className="field__label">Order</span>
          <select value={f.sort} onChange={(e) => set("sort", e.target.value as "asc" | "desc")}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
        <div className="tfilters__end">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setExpanded(new Set(events.map((e) => e.id)))}>Expand all</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setExpanded(new Set())}>Collapse all</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setF({ ...EMPTY_TIMELINE_FILTERS })} disabled={n === 0}><IconReset size={14} /> Reset</button>
        </div>
      </div>
      <p className="tfilters__count" aria-live="polite">
        <IconFilter size={14} /> {events.length} of {repo.ds.events.length} events{n > 0 ? ` · ${n} filter${n > 1 ? "s" : ""} active` : ""}
      </p>
      {n > 0 && (
        <div className="chips">
          {f.q && <Chip onRemove={() => set("q", "")}>{`Search: "${f.q}"`}</Chip>}
          {f.from && <Chip onRemove={() => set("from", undefined)}>{`From ${fmtDate(f.from)}`}</Chip>}
          {f.to && <Chip onRemove={() => set("to", undefined)}>{`To ${fmtDate(f.to)}`}</Chip>}
          {f.types.map((t) => <Chip key={t} onRemove={() => set("types", f.types.filter((x) => x !== t))}>{t}</Chip>)}
          {f.organisationIds.map((t) => <Chip key={t} onRemove={() => set("organisationIds", f.organisationIds.filter((x) => x !== t))}>{repo.orgName(t)}</Chip>)}
          {f.serviceIds.map((t) => <Chip key={t} onRemove={() => set("serviceIds", f.serviceIds.filter((x) => x !== t))}>{repo.svcName(t)}</Chip>)}
          {f.statuses.map((t) => <Chip key={t} onRemove={() => set("statuses", f.statuses.filter((x) => x !== t))}>{t}</Chip>)}
          {f.significantOnly && <Chip onRemove={() => set("significantOnly", false)}>Significant only</Chip>}
        </div>
      )}
      {events.length === 0 ? (
        <EmptyState title="No events match" action={<button type="button" className="btn" onClick={() => setF({ ...EMPTY_TIMELINE_FILTERS })}><IconReset size={16} /> Reset filters</button>}>
          No recorded events match the current search and filters.
        </EmptyState>
      ) : (
        <div className="tl">
          {groups.map((g) => (
            <div key={g.key} className="tl__group">
              <h3 className="tl__month">{g.key}</h3>
              <ol className="tl__list">
                {g.items.map((e) => {
                  const org = repo.organisation(e.organisationId)!;
                  const isOpen = expanded.has(e.id);
                  const lm = repo.landmarkForEvent(e.id);
                  return (
                    <li key={e.id} className={`tl__item ${e.significant ? "is-significant" : ""} ${e.status === "Scheduled" ? "is-future" : ""}`}>
                      <div className="tl__date">
                        <span className="tl__day">{fmtDate(e.occurredAt).split(" ").slice(0, 2).join(" ")}</span>
                        <span className="tl__time">{fmtTime(e.occurredAt)}</span>
                      </div>
                      <div className="tl__dot" aria-hidden="true" />
                      <div className="tl__card">
                        <div className="tl__top">
                          <span className="tl__type">{e.eventType}</span>
                          {org.sector !== "NHS" && <SectorTag sector={org.sector} jurisdiction={org.jurisdiction} />}
                          {gapEventIds.has(e.id) && <span className="pill pill--attention pill--sm"><IconAlert size={12} /> Information gap</span>}
                        </div>
                        <button type="button" className="tl__title" onClick={() => open({ kind: "event", id: e.id }, { replace: true })}>{e.title}</button>
                        <p className="tl__meta">{repo.svcName(e.serviceId)} · {org.name} <StatusPill status={e.status} size="sm" /></p>
                        {isOpen && (
                          <div className="tl__more" id={`tl-more-${e.id}`}>
                            <p>{mode === "patient" ? e.plainSummary ?? e.summary : e.summary}</p>
                            {e.outcome && <p><strong>Outcome:</strong> {e.outcome}</p>}
                            {e.receivedAt && <p className="small muted">Event date {fmtDate(e.occurredAt)} · added to record {fmtDate(e.receivedAt)}</p>}
                            {mode === "pro" && <p className="small muted">Source: {repo.source(e.sourceRecordId)?.sourceType} · recorded {fmtDate(e.recordedAt)} · <code>{e.id}</code></p>}
                          </div>
                        )}
                        <div className="tl__actions">
                          <button type="button" className="linkbtn linkbtn--sm" aria-expanded={isOpen} aria-controls={`tl-more-${e.id}`} onClick={() => toggle(e.id)}>
                            {isOpen ? "Less" : "Summary"} <IconChevronDown size={12} />
                          </button>
                          <button type="button" className="linkbtn linkbtn--sm" onClick={() => open({ kind: "event", id: e.id }, { replace: true })}>Full details <IconChevronRight size={12} /></button>
                          {lm && <button type="button" className="linkbtn linkbtn--sm" onClick={() => showOnJourney(lm.id)}><IconMap size={12} /> On journey</button>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
