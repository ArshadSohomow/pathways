import React, { useMemo, useState } from "react";
import { useApp } from "../context";
import { Landscape } from "../components/Landscape";
import { Timeline } from "../components/Timeline";
import { Card, PageHeader, StatusPill, RecordLink, EmptyState, GapCallout, KV, SectorTag, DateText, Chip } from "../components/common";
import { fmtDate, fmtDateTime, isFuture, isPast, daysBetween, DEMO_TODAY, calcDuration, fmtDays, datePart, DURATION_CONVENTION, dayNumber } from "../lib/dates";
import { RULES, refLabel, GapCategory } from "../lib/gaps";
import { IconAlert, IconCalendar, IconChevronRight, IconFile, IconGlobe, IconHospital, IconMap, IconPhone, IconInfo } from "../components/icons";
import { LandmarkArt } from "../components/Glyphs";
import type { MedicationRecord } from "../types";

// ============================================================ Journey
export function Journey() {
  const { mode } = useApp();
  return (
    <>
      <PageHeader title={mode === "pro" ? "Journey Explorer" : "My Journey"} intro={mode === "pro" ? "The illustrated journey with every landmark linked to its source records. Use the timeline below for event-level precision." : "Follow the trail to see each step of your care. You can switch to a simple list at any time, or use the timeline below."} />
      <Landscape />
      <Timeline />
    </>
  );
}

// ============================================================ Appointments (patient)
export function Appointments() {
  const { repo, open } = useApp();
  const appts = [...repo.ds.appointments].sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : 1));
  const upcoming = appts.filter((a) => isFuture(a.scheduledAt));
  const past = appts.filter((a) => !isFuture(a.scheduledAt)).reverse();
  const hospital = repo.ds.episodes.filter((e) => e.episodeKind === "Inpatient");
  const ed = repo.ds.events.filter((e) => e.eventType === "Emergency department presentation");
  return (
    <>
      <PageHeader title="Appointments" intro="Booked appointments first, then past appointments and hospital visits." />
      <h2 className="section-title">Upcoming</h2>
      {upcoming.length === 0 ? <EmptyState title="No upcoming appointments are recorded" /> : (
        <div className="grid grid--cards">
          {upcoming.map((a) => {
            const svc = repo.service(a.serviceId);
            return (
              <article className="card appt" key={a.id}>
                <p className="appt__date"><IconCalendar size={16} /> {fmtDateTime(a.scheduledAt, { weekday: true })}</p>
                <h3 className="appt__title">{svc?.name}</h3>
                <p className="small muted">{repo.orgName(a.organisationId)}</p>
                <KV items={[["Type", a.appointmentType], ["Where", a.location], ["With", a.clinicianRole], ["Contact", svc?.contactDetails?.phone ?? repo.organisation(a.organisationId)?.contactDetails.phone]]} />
                <div className="appt__foot"><StatusPill status="Booked" tone="upcoming" /><RecordLink to={{ kind: "appointment", id: a.id }}>Details <IconChevronRight size={12} /></RecordLink></div>
              </article>
            );
          })}
        </div>
      )}
      {(ed.length > 0 || hospital.length > 0) && (
        <>
          <h2 className="section-title section-title--spaced">Hospital visits</h2>
          <ul className="rows">
            {ed.map((e) => <li key={e.id}><IconHospital size={18} /><div><RecordLink to={{ kind: "event", id: e.id }}>Emergency Department visit</RecordLink><p className="small muted">{fmtDateTime(e.occurredAt)} · {repo.orgName(e.organisationId)} · arrived by {e.metadata?.arrivalMethod?.toLowerCase() ?? "not recorded"}</p></div></li>)}
            {hospital.map((h) => { const d = calcDuration(h.startDate, h.endDate, h.status === "Ongoing"); return <li key={h.id}><IconHospital size={18} /><div><RecordLink to={{ kind: "episode", id: h.id }}>{h.plainTitle ?? h.title}</RecordLink><p className="small muted">{fmtDate(h.startDate)} – {h.endDate ? fmtDate(h.endDate) : "ongoing"} · {d.label}</p></div></li>; })}
          </ul>
        </>
      )}
      <h2 className="section-title section-title--spaced">Past appointments</h2>
      <ul className="rows">
        {past.map((a) => (
          <li key={a.id}>
            <IconCalendar size={18} />
            <div className="rows__main">
              <button type="button" className="linkbtn" onClick={() => open({ kind: "appointment", id: a.id })}>{repo.svcName(a.serviceId)} — {a.appointmentType}</button>
              <p className="small muted">{fmtDateTime(a.scheduledAt)} · {repo.orgName(a.organisationId)}</p>
              {a.outcome && <p className="small">{a.outcome}</p>}
            </div>
            <StatusPill status={a.status} size="sm" />
          </li>
        ))}
      </ul>
    </>
  );
}

// ============================================================ Encounters (pro)
export function Encounters() {
  const { repo, open } = useApp();
  const [noOutcome, setNoOutcome] = useState(false);
  const ed = repo.ds.events.filter((e) => e.eventType === "Emergency department presentation");
  const admissions = repo.ds.events.filter((e) => e.eventType === "Admission");
  const appts = [...repo.ds.appointments].sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1)).filter((a) => !noOutcome || (!isFuture(a.scheduledAt) && (a.status === "Outcome not recorded" || a.status === "Scheduled")));
  return (
    <>
      <PageHeader title="Encounters & admissions" intro="Emergency presentations, inpatient admissions (with ward transfers and discharges) and all appointments. An ED presentation, an admission, a transfer and a discharge are separate records." />
      <h2 className="section-title">Hospital encounters</h2>
      {ed.length === 0 && admissions.length === 0 ? <EmptyState title="No hospital encounters recorded" /> : (
        <div className="stack">
          {ed.map((e) => {
            const admit = repo.relatedEvents(e.id).find((x) => x.eventType === "Admission");
            const amb = repo.relatedEvents(e.id).find((x) => x.eventType === "Ambulance attendance");
            const ep = admit ? repo.episodesForEvent(admit.id).find((x) => x.episodeKind === "Inpatient") : undefined;
            const evs = ep ? repo.events(ep.relatedEventIds) : [];
            const discharge = evs.find((x) => x.eventType === "Discharge");
            const transfers = evs.filter((x) => x.eventType === "Ward transfer");
            const los = ep ? calcDuration(ep.startDate, ep.endDate, ep.status === "Ongoing") : undefined;
            return (
              <Card key={e.id} title={<>Encounter: {fmtDate(e.occurredAt)}</>} icon={<IconHospital size={18} />} headingLevel={3}>
                <ol className="enc">
                  {amb && <li><span className="enc__k">Ambulance</span><RecordLink to={{ kind: "event", id: amb.id }}>{amb.title}</RecordLink><span className="small muted">{fmtDateTime(amb.occurredAt)}</span></li>}
                  <li><span className="enc__k">ED presentation</span><RecordLink to={{ kind: "event", id: e.id }}>{repo.svcName(e.serviceId)}</RecordLink><span className="small muted">{fmtDateTime(e.occurredAt)} · arrival: {e.metadata?.arrivalMethod ?? "not recorded"} · outcome: {e.outcome ?? "not recorded"}</span></li>
                  {admit && <li><span className="enc__k">Admission</span><RecordLink to={{ kind: "event", id: admit.id }}>{repo.svcName(admit.serviceId)}</RecordLink><span className="small muted">{fmtDateTime(admit.occurredAt)} · reason: {admit.metadata?.reason ?? "not recorded"}</span></li>}
                  {transfers.map((t) => <li key={t.id}><span className="enc__k">Ward transfer</span><RecordLink to={{ kind: "event", id: t.id }}>{repo.svcName(t.serviceId)}</RecordLink><span className="small muted">{fmtDateTime(t.occurredAt)}</span></li>)}
                  {discharge ? <li><span className="enc__k">Discharge</span><RecordLink to={{ kind: "event", id: discharge.id }}>{discharge.title}</RecordLink><span className="small muted">{fmtDateTime(discharge.occurredAt)} · destination: {discharge.metadata?.dischargeDestination ?? "not recorded"}</span></li> : admit && <li><span className="enc__k">Discharge</span><span className="warn-text">Not recorded</span></li>}
                </ol>
                {los && <p className="small"><strong>Length of stay:</strong> {los.label} <span className="muted">(admission {fmtDate(ep!.startDate)} → discharge {fmtDate(ep!.endDate)}; elapsed calendar days)</span></p>}
                {discharge && <p className="small"><strong>Follow-up arrangements:</strong> {repo.actionsForEvent(discharge.id).map((a) => a.title).join("; ") || "none recorded"}{discharge.relatedReferralIds.length ? ` · referral: ${discharge.relatedReferralIds.map((r) => `${repo.svcName(repo.referral(r)?.receivingServiceId)} (${repo.referral(r)?.currentStatus})`).join(", ")}` : ""}</p>}
              </Card>
            );
          })}
        </div>
      )}
      <div className="sectionbar">
        <h2 className="section-title section-title--spaced">Appointments</h2>
        <label className="toggle-inline"><input type="checkbox" checked={noOutcome} onChange={(e) => setNoOutcome(e.target.checked)} /> Past appointments without a recorded outcome</label>
      </div>
      {appts.length === 0 ? <EmptyState title="No appointments match" /> : (
        <div className="tablewrap">
          <table className="table">
            <thead><tr><th scope="col">Date and time</th><th scope="col">Service</th><th scope="col">Type</th><th scope="col">Location</th><th scope="col">Status</th><th scope="col">Outcome</th><th scope="col">Referral</th><th scope="col">Follow-up</th></tr></thead>
            <tbody>
              {appts.map((a) => (
                <tr key={a.id}>
                  <td><button type="button" className="linkbtn" onClick={() => open({ kind: "appointment", id: a.id })}>{fmtDateTime(a.scheduledAt)}</button></td>
                  <td>{repo.svcName(a.serviceId)}<br /><span className="small muted">{repo.orgName(a.organisationId)}</span></td>
                  <td>{a.appointmentType}</td><td>{a.location}</td>
                  <td><StatusPill status={a.status} size="sm" /></td>
                  <td>{a.outcome ?? <span className="muted">Not recorded</span>}</td>
                  <td>{a.linkedReferralId ? <RecordLink to={{ kind: "referral", id: a.linkedReferralId }}>{refLabel(a.linkedReferralId)}</RecordLink> : "—"}</td>
                  <td>{a.followUpEventIds.length ? repo.events(a.followUpEventIds).map((e) => <div key={e.id}><RecordLink to={{ kind: "event", id: e.id }}>{e.title}</RecordLink></div>) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ============================================================ Referrals (pro)
export function Referrals() {
  const { repo, open, gaps } = useApp();
  const [status, setStatus] = useState("all");
  const refs = repo.ds.referrals.filter((r) => status === "all" || r.currentStatus === status).sort((a, b) => ((b.sentAt ?? "") > (a.sentAt ?? "") ? 1 : -1));
  const statuses = [...new Set(repo.ds.referrals.map((r) => r.currentStatus))];
  return (
    <>
      <PageHeader title="Referrals" intro="Every referral from origin to its latest recorded status. Waiting times are calculated from recorded dates; nothing is labelled overdue without a documented deadline.">
        <label className="field field--inline"><span className="field__label">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
        </label>
      </PageHeader>
      {refs.length === 0 ? <EmptyState title="No referrals match" action={<button className="btn" type="button" onClick={() => setStatus("all")}>Show all</button>} /> : (
        <div className="tablewrap">
          <table className="table">
            <thead><tr><th scope="col">Referral</th><th scope="col">From</th><th scope="col">To</th><th scope="col">Sent</th><th scope="col">Received</th><th scope="col">Decision</th><th scope="col">Wait for decision</th><th scope="col">Status</th><th scope="col">Outcome</th><th scope="col">Updated</th></tr></thead>
            <tbody>
              {refs.map((r) => {
                const g = gaps.filter((x) => x.refs.some((y) => y.kind === "referral" && y.id === r.id));
                const wait = r.receivedAt ? (r.decisionAt ? fmtDays(daysBetween(r.receivedAt, r.decisionAt)) : `${daysBetween(r.receivedAt, DEMO_TODAY)} days so far`) : "—";
                return (
                  <tr key={r.id}>
                    <td><button type="button" className="linkbtn" onClick={() => open({ kind: "referral", id: r.id })}><code>{refLabel(r.id)}</code></button>{g.length > 0 && <><br /><span className="pill pill--attention pill--sm"><IconAlert size={12} /> {g.length} gap{g.length > 1 ? "s" : ""}</span></>}</td>
                    <td>{repo.svcName(r.referringServiceId)}<br /><span className="small muted">{repo.orgName(r.referringOrganisationId)}</span></td>
                    <td>{repo.svcName(r.receivingServiceId)}<br /><span className="small muted">{repo.orgName(r.receivingOrganisationId)}</span></td>
                    <td>{r.sentAt ? fmtDate(r.sentAt) : "—"}</td>
                    <td>{r.receivedAt ? fmtDate(r.receivedAt) : <span className="warn-text">Not recorded</span>}</td>
                    <td>{r.decisionAt ? fmtDate(r.decisionAt) : <span className="warn-text">Not recorded</span>}</td>
                    <td>{wait}</td>
                    <td><StatusPill status={r.currentStatus} size="sm" /></td>
                    <td className="small">{r.outcome ?? <span className="muted">Not recorded</span>}</td>
                    <td className="small">{fmtDate(r.lastUpdatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="small muted">Select a referral ID to trace its status history, linked appointments and assessments, and its signpost on the journey.</p>
    </>
  );
}

// ============================================================ Medications
function MedRow({ m }: { m: MedicationRecord }) {
  const { repo, open, mode } = useApp();
  return (
    <li className="medrow">
      <button type="button" className="medrow__btn" onClick={() => open({ kind: "medication", id: m.id })}>
        <span className="medrow__name">{m.medicationName} <span className="medrow__dose">{m.recordedDose}</span></span>
        <span className="small">{m.route} · {m.frequency}</span>
        <span className="small muted">{m.startDate ? `Started ${fmtDate(m.startDate)}` : "Start date not recorded"}{m.endDate ? ` · ended ${fmtDate(m.endDate)}` : ""} · {repo.orgName(m.organisationId)}{mode === "pro" ? ` · ${m.recordType}` : ""}</span>
        {m.note && <span className="small medrow__note">{m.note}</span>}
      </button>
      <StatusPill status={m.status} size="sm" />
    </li>
  );
}

export function Medications() {
  const { repo, mode, gaps } = useApp();
  const meds = repo.ds.medications;
  const recentCut = dayNumber(DEMO_TODAY) - 120;
  const current = meds.filter((m) => m.status === "Active");
  const recent = meds.filter((m) => m.startDate && dayNumber(m.startDate) >= recentCut);
  const changed = meds.filter((m) => m.status === "Changed" || m.status === "Stopped");
  const awaiting = meds.filter((m) => m.status === "Awaiting reconciliation");
  const historical = meds.filter((m) => m.status === "Completed course" || m.status === "Stopped" || m.status === "Changed");
  const medGaps = gaps.filter((g) => g.ruleId === "R5");
  const groups = [...new Set(meds.map((m) => m.medicationGroup))];

  const Sec = ({ title, items, intro }: { title: string; items: MedicationRecord[]; intro?: string }) => (
    <section className="medsec">
      <h2 className="section-title">{title} <span className="count">{items.length}</span></h2>
      {intro && <p className="small muted">{intro}</p>}
      {items.length ? <ul className="medlist">{items.map((m) => <MedRow key={m.id} m={m} />)}</ul> : <p className="muted">None recorded.</p>}
    </section>
  );

  return (
    <>
      <PageHeader title="Medications" intro={mode === "patient" ? "Medicines recorded by the services involved in your care. This is a record, not advice — please speak to your GP practice or pharmacist before changing anything." : "Medication records from all sources. Current use is never inferred from an old prescription; conflicting records are shown side by side with their sources."} />
      {medGaps.length > 0 && <div className="stack">{medGaps.map((g) => <GapCallout key={g.id} gap={g} />)}</div>}
      {mode === "pro" && awaiting.length > 0 && (
        <Card title="Reconciliation required" icon={<IconAlert size={18} />} className="card--attention">
          {groups.filter((g) => awaiting.some((m) => m.medicationGroup === g)).map((g) => {
            const recs = meds.filter((m) => m.medicationGroup === g && (m.status === "Awaiting reconciliation" || m.status === "Active"));
            return (
              <div key={g} className="recon">
                <h3 className="recon__title">{recs[0].medicationName}</h3>
                <div className="recon__cols">
                  {recs.map((m) => (
                    <div key={m.id} className="recon__col">
                      <p className="recon__dose">{m.recordedDose} · {m.frequency}</p>
                      <KV items={[["Source", repo.source(m.sourceRecordId)?.sourceType], ["Organisation", repo.orgName(m.organisationId)], ["Record type", m.recordType], ["Start", m.startDate ? fmtDate(m.startDate) : "Not recorded"], ["Last updated", fmtDate(m.lastUpdatedAt)]]} />
                      <RecordLink to={{ kind: "medication", id: m.id }}>Open record</RecordLink>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </Card>
      )}
      <Sec title="Current medication records" items={current} intro="Recorded as active. Where a record has not been re-issued recently, the note says so." />
      <Sec title="Recently started" items={recent} intro="Started within the 120 days before the demonstration date." />
      <Sec title="Awaiting reconciliation" items={awaiting} intro="Records that conflict with another record and need checking." />
      <Sec title="Changed or stopped" items={changed} />
      <Sec title="Historical records" items={historical} intro="Completed courses and earlier doses." />
    </>
  );
}

// ============================================================ Care teams
export function Teams() {
  const { repo, mode, open } = useApp();
  const teams = [...repo.ds.teams].sort((a, b) => (a.startDate ?? "9") < (b.startDate ?? "9") ? -1 : 1);
  const starts = teams.map((t) => t.startDate).filter(Boolean) as string[];
  const minD = starts.length ? starts.sort()[0].slice(0, 7) + "-01" : "2026-01-01";
  const maxD = "2026-12-31";
  const span = daysBetween(minD, maxD);
  const pct = (d: string) => (daysBetween(minD, d) / span) * 100;
  const months: string[] = [];
  for (let d = new Date(minD + "T00:00:00Z"); d.toISOString().slice(0, 10) <= maxD; d.setUTCMonth(d.getUTCMonth() + 1)) months.push(d.toISOString().slice(0, 10));
  const groups: [string, typeof teams][] = [["Current", teams.filter((t) => t.involvementStatus === "Current")], ["Referred, not yet involved", teams.filter((t) => t.involvementStatus === "Referred, not yet involved")], ["Historical", teams.filter((t) => t.involvementStatus === "Historical")]];
  return (
    <>
      <PageHeader title={mode === "pro" ? "Teams & services" : "Care teams"} intro={mode === "pro" ? "Which organisations and teams have been involved, for how long, and what each is recorded as responsible for. No single team is assumed to own every aspect of care." : "The teams involved in your care, when they were involved and how to contact them."} />
      <Card title="Periods of involvement" icon={<IconMap size={18} />}>
        <div className="gantt" role="table" aria-label="Periods of involvement by service" style={{ ["--cols" as any]: months.length, ["--today" as any]: `${pct(DEMO_TODAY)}%` }}>
          <div className="gantt__axis" role="row" aria-hidden="true">
            <span role="columnheader" className="gantt__label" />
            <div className="gantt__track">{months.map((m) => <span key={m} style={{ left: `${pct(m)}%` }}>{fmtDate(m).split(" ")[1]}</span>)}</div>
          </div>
          {teams.map((t) => {
            const s = t.startDate, e = t.endDate ?? (t.involvementStatus === "Current" ? DEMO_TODAY : undefined);
            const d = calcDuration(t.startDate, t.endDate, t.involvementStatus === "Current");
            return (
              <div className="gantt__row" role="row" key={t.id}>
                <span className="gantt__label" role="rowheader"><button type="button" className="linkbtn" onClick={() => open({ kind: "service", id: t.serviceId })}>{repo.svcName(t.serviceId)}</button><span className="small muted">{repo.svcOrg(t.serviceId)?.name}</span></span>
                <div className="gantt__track" role="cell">
                  {s ? (
                    <span className={`gantt__bar gantt__bar--${t.involvementStatus === "Current" ? "current" : "past"} ${s === e ? "is-point" : ""}`} style={{ left: `${pct(s)}%`, width: e ? `max(10px, ${pct(e) - pct(s)}%)` : "10px" }} title={d.label}>
                      <span className="sr-only">{fmtDate(s)} to {t.endDate ? fmtDate(t.endDate) : t.involvementStatus === "Current" ? "ongoing" : "end not recorded"}: {d.label}</span>
                    </span>
                  ) : (
                    <span className="gantt__none">{t.involvementStatus === "Referred, not yet involved" ? "Referred — not yet involved" : "Start date not recorded"}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="small muted"><span className="gantt__key" aria-hidden="true" /> The amber line marks the demonstration date ({fmtDate(DEMO_TODAY)}). Dots are single-day contacts. {DURATION_CONVENTION}</p>
      </Card>
      {groups.map(([label, items]) => items.length > 0 && (
        <section key={label}>
          <h2 className="section-title section-title--spaced">{label}</h2>
          <div className="grid grid--cards">
            {items.map((t) => {
              const svc = repo.service(t.serviceId)!;
              const org = repo.organisation(svc.organisationId)!;
              const d = calcDuration(t.startDate, t.endDate, t.involvementStatus === "Current");
              const actions = repo.ds.actions.filter((a) => a.responsibleServiceId === svc.id && a.status !== "Completed");
              const evCount = repo.eventsForService(svc.id).length;
              const refs = repo.referralsForService(svc.id);
              return (
                <article className="card team" key={t.id}>
                  <div className="team__head"><h3 className="team__title">{svc.name}</h3><SectorTag sector={org.sector} jurisdiction={org.jurisdiction} /></div>
                  <p className="small muted">{org.name} · {org.location}</p>
                  <KV items={[
                    ["Role in journey", t.roleInJourney],
                    ["Involved", t.startDate ? `${fmtDate(t.startDate)} – ${t.endDate ? fmtDate(t.endDate) : t.involvementStatus === "Current" ? "ongoing" : "not recorded"}` : t.involvementStatus === "Referred, not yet involved" ? "Not yet" : "Start not recorded"],
                    ["Duration", t.startDate ? d.label : undefined],
                    ["Responsible for", t.responsibilityDescription],
                    [actions.length ? "Next action owned" : undefined, actions.map((a) => <div key={a.id}><RecordLink to={{ kind: "action", id: a.id }}>{mode === "patient" ? a.plainTitle ?? a.title : a.title}</RecordLink></div>)],
                    ["Contact", (svc.contactDetails?.phone ?? org.contactDetails.phone) && <span><IconPhone size={13} /> {svc.contactDetails?.phone ?? org.contactDetails.phone}</span>],
                  ]} />
                  <p className="small"><button type="button" className="linkbtn linkbtn--sm" onClick={() => open({ kind: "service", id: svc.id })}>{evCount} event{evCount === 1 ? "" : "s"}{refs.length ? `, ${refs.length} referral${refs.length > 1 ? "s" : ""}` : ""} <IconChevronRight size={12} /></button></p>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

// ============================================================ Documents (patient) & Records (pro)
function DocTable() {
  const { repo, open, mode } = useApp();
  const [type, setType] = useState("all");
  const docs = [...repo.ds.documents].filter((d) => type === "all" || d.documentType === type).sort((a, b) => ((b.documentDate ?? "") > (a.documentDate ?? "") ? 1 : -1));
  const types = [...new Set(repo.ds.documents.map((d) => d.documentType))];
  return (
    <>
      <div className="sectionbar">
        <h2 className="section-title">Documents</h2>
        <label className="field field--inline"><span className="field__label">Type</span><select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All types</option>{types.map((t) => <option key={t}>{t}</option>)}</select></label>
      </div>
      <ul className="doclist">
        {docs.map((d) => {
          const e = d.eventId ? repo.event(d.eventId) : undefined;
          const org = repo.organisation(d.organisationId)!;
          return (
            <li key={d.id} className={`doc ${d.availabilityStatus === "Referenced, not received" ? "is-missing" : ""}`}>
              <IconFile size={22} />
              <div className="doc__main">
                <button type="button" className="linkbtn doc__title" onClick={() => open({ kind: "document", id: d.id })}>{d.title}</button>
                <p className="small muted">{d.documentType} · {org.name}{org.sector === "Overseas" ? ` (${org.jurisdiction})` : ""}</p>
                <p className="small">Dated {d.documentDate ? fmtDate(d.documentDate) : "—"} · {d.receivedAt ? `received ${fmtDate(d.receivedAt)}` : "not received"}{e ? <> · about <RecordLink to={{ kind: "event", id: e.id }}>{e.title}</RecordLink></> : null}</p>
              </div>
              <div className="doc__side">
                <StatusPill status={d.availabilityStatus} size="sm" />
                {d.availabilityStatus !== "Referenced, not received" ? <button type="button" className="btn btn--sm" onClick={() => open({ kind: "document", id: d.id })}>Preview</button> : <span className="small muted">No copy to view</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function Documents() {
  return (
    <>
      <PageHeader title="Documents" intro="Letters, reports and summaries in your record. If a letter is mentioned but we don't have a copy, it says so here — there's no broken download link." />
      <DocTable />
    </>
  );
}

export function Records() {
  const { repo, open } = useApp();
  return (
    <>
      <PageHeader title="Records & documents" intro="Documents and the provenance of every imported record: source, jurisdiction, received date, verification status." />
      <h2 className="section-title">Record sources</h2>
      <div className="tablewrap">
        <table className="table">
          <thead><tr><th scope="col">Source</th><th scope="col">Organisation</th><th scope="col">Jurisdiction</th><th scope="col">Reference</th><th scope="col">Received</th><th scope="col">Verification</th><th scope="col">Events</th></tr></thead>
          <tbody>
            {repo.ds.sources.map((s) => (
              <tr key={s.id}>
                <td><button type="button" className="linkbtn" onClick={() => open({ kind: "source", id: s.id })}>{s.sourceType}</button></td>
                <td>{repo.orgName(s.organisationId)}</td><td>{s.jurisdiction}</td><td><code>{s.sourceReference}</code></td>
                <td>{fmtDateTime(s.receivedAt)}</td><td><StatusPill status={s.verificationStatus} size="sm" /></td>
                <td>{repo.ds.events.filter((e) => e.sourceRecordId === s.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DocTable />
    </>
  );
}

// ============================================================ Details (patient)
export function Details() {
  const { repo, open } = useApp();
  const p = repo.patient;
  const gp = repo.organisation(p.gpOrganisationId)!;
  return (
    <>
      <PageHeader title="My details" intro="The details held in this demonstration record. All of them are fictional." />
      <div className="grid grid--2">
        <Card title="About you">
          <KV items={[["Name", p.displayName], ["Date of birth", fmtDate(p.dateOfBirth, { long: true })], ["Pronouns", p.pronouns], ["Address", p.address], ["Phone", p.phone], ["Email", p.email], ["Communication needs", p.communicationNeeds], ...p.demonstrationIdentifiers.map((d) => [d.label, <code>{d.value}</code>] as [string, React.ReactNode])]} />
        </Card>
        <Card title="Your GP practice">
          <KV items={[["Practice", gp.name], ["Address", gp.contactDetails.address], ["Phone", gp.contactDetails.phone], ["Opening hours", gp.contactDetails.hours]]} />
        </Card>
      </div>
      <Card title="Where your information comes from" className="mt">
        <ul className="rows">
          {repo.ds.sources.map((s) => (
            <li key={s.id}>
              {s.jurisdiction.endsWith("UK") ? <IconFile size={18} /> : <IconGlobe size={18} />}
              <div className="rows__main">
                <button type="button" className="linkbtn" onClick={() => open({ kind: "source", id: s.id })}>{repo.orgName(s.organisationId)}</button>
                <p className="small muted">{s.sourceType} · {s.jurisdiction} · last received {fmtDate(s.receivedAt)}</p>
              </div>
              <StatusPill status={s.verificationStatus} size="sm" />
            </li>
          ))}
        </ul>
        <p className="small muted">Records that arrive late (for example, from a clinic abroad) appear on your journey on the date the care happened, with the date they were added shown in the details.</p>
      </Card>
      <Card title="About this demonstration" className="mt">
        <p>Pathways is a prototype showing how a joined-up view of healthcare records could work. It uses only fictional people and synthetic records. It is not connected to the NHS, private providers or any real clinical system, and nothing you do here is saved or sent anywhere.</p>
      </Card>
    </>
  );
}

// ============================================================ Actions & gaps (pro)
export function Actions() {
  const { repo, gaps, open } = useApp();
  const [cat, setCat] = useState<GapCategory | "all">("all");
  const shown = gaps.filter((g) => cat === "all" || g.category === cat);
  const actions = repo.ds.actions.filter((a) => a.status !== "Completed");
  return (
    <>
      <PageHeader title="Outstanding actions" intro="Recorded next steps and the transparent rules that flag information gaps. Findings describe the documentation, not the quality of care." />
      <h2 className="section-title">Recorded actions</h2>
      <div className="tablewrap">
        <table className="table">
          <thead><tr><th scope="col">Action</th><th scope="col">Responsible</th><th scope="col">When</th><th scope="col">Status</th><th scope="col">Source events</th></tr></thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id}>
                <td><button type="button" className="linkbtn" onClick={() => open({ kind: "action", id: a.id })}>{a.title}</button><br /><span className="small muted">{a.description}</span></td>
                <td>{a.responsibleRoleId ?? <span className="warn-text">Not recorded</span>}</td>
                <td>{a.dueAt ? fmtDate(a.dueAt) : a.dueText ?? <span className="muted">No date recorded</span>}{a.dueAt && isPast(a.dueAt) && a.status === "No completion recorded" && <><br /><span className="small warn-text">Documented date passed</span></>}</td>
                <td><StatusPill status={a.status} size="sm" /></td>
                <td className="small">{repo.events(a.sourceEventIds).map((e) => <div key={e.id}><RecordLink to={{ kind: "event", id: e.id }}>{e.title}</RecordLink></div>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sectionbar">
        <h2 className="section-title section-title--spaced" id="gaps">Information gaps and follow-up</h2>
        <div className="seg" role="group" aria-label="Filter findings by category">
          {(["all", "Potential coordination issue", "Review recommended", "Information incomplete"] as const).map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} className={cat === c ? "is-on" : ""} onClick={() => setCat(c)}>
              {c === "all" ? `All (${gaps.length})` : `${c} (${gaps.filter((g) => g.category === c).length})`}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? <EmptyState title="No findings in this category" /> : (
        <div className="findings">
          {shown.map((g) => (
            <article key={g.id} className={`finding finding--${g.category === "Information incomplete" ? "info" : g.category === "Review recommended" ? "review" : "coord"}`}>
              <header>
                <span className="finding__cat">{g.category} · Rule {g.ruleId}</span>
                <h3 className="finding__title">{g.title}</h3>
              </header>
              <ol className="finding__steps">
                <li><strong>What was found:</strong> {g.whatFound}</li>
                <li><strong>Why it matters:</strong> {g.whyMatters}</li>
                <li><strong>Records involved:</strong> {g.refs.map((r, i) => <React.Fragment key={i}>{i > 0 && " · "}<RecordLink to={{ kind: r.kind, id: r.id }}>{r.label}</RecordLink></React.Fragment>)}</li>
                <li><strong>Missing or inconsistent:</strong> {g.missing}</li>
                <li><strong>Who should review:</strong> {g.reviewer ?? "Not known from the record"}</li>
                <li><strong>Appropriate next action:</strong> {g.nextAction}</li>
              </ol>
              <button type="button" className="linkbtn linkbtn--sm" onClick={() => open({ kind: "gap", id: g.id })}>Open finding <IconChevronRight size={12} /></button>
            </article>
          ))}
        </div>
      )}
      <details className="rules">
        <summary>Detection rules ({RULES.length})</summary>
        <ul>{RULES.map((r) => <li key={r.id}><strong>{r.id} · {r.name}</strong> <span className="muted">({r.category})</span><br /><span className="small">{r.logic}</span></li>)}</ul>
      </details>
    </>
  );
}

// ============================================================ Audit (pro)
export function Audit() {
  const { repo, open } = useApp();
  const [type, setType] = useState("all");
  const items = [...repo.ds.audit].filter((a) => type === "all" || a.actionType === type).sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  const types = [...new Set(repo.ds.audit.map((a) => a.actionType))];
  const kindFor = (t: string) => ({ RecordSource: "source", Referral: "referral", MedicationRecord: "medication", Document: "document" } as Record<string, any>)[t];
  return (
    <>
      <PageHeader title="Audit history" intro="A synthetic audit trail of imports, views and status changes. In production this would be immutable and access-controlled.">
        <label className="field field--inline"><span className="field__label">Action</span><select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All actions</option>{types.map((t) => <option key={t}>{t}</option>)}</select></label>
      </PageHeader>
      <div className="tablewrap">
        <table className="table">
          <thead><tr><th scope="col">When</th><th scope="col">Actor (role)</th><th scope="col">Action</th><th scope="col">Entity</th><th scope="col">Description</th></tr></thead>
          <tbody>
            {items.map((a) => {
              const k = kindFor(a.entityType);
              return (
                <tr key={a.id}>
                  <td>{fmtDateTime(a.occurredAt)}</td><td>{a.actorRole}</td><td>{a.actionType}</td>
                  <td>{k ? <RecordLink to={{ kind: k, id: a.entityId }}>{a.entityType}</RecordLink> : a.entityType} <code className="small">{a.entityId}</code></td>
                  <td>{a.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
