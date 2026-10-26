import React, { useEffect, useRef } from "react";
import { useApp, PanelRef } from "../context";
import { IconArrowLeft, IconX, IconMap, IconChevronRight, IconFile, IconAlert, IconArrowRight, IconPhone, IconDatabase } from "./icons";
import { KV, StatusPill, LandmarkStatusPill, GapCallout, SectorTag, DateText, RecordLink, EmptyState } from "./common";
import { LandmarkGlyph } from "./Glyphs";
import { TYPE_META, LandmarkVM } from "../lib/landmarks";
import { fmtDate, fmtDateTime, DURATION_CONVENTION, daysBetween, fmtDays, calcDuration, isFuture, DEMO_TODAY } from "../lib/dates";
import { RULES, refLabel } from "../lib/gaps";
import { landmarkDateText } from "./Landscape";
import type { HealthcareEvent } from "../types";

export function DetailPanel() {
  const { panel, back, close } = useApp();
  const ref = panel[panel.length - 1];
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (ref && !wasOpen.current) {
      returnFocus.current = document.activeElement as HTMLElement;
      document.body.classList.add("panel-open");
    }
    if (!ref && wasOpen.current) {
      document.body.classList.remove("panel-open");
      const el = returnFocus.current;
      if (el && document.contains(el)) setTimeout(() => el.focus(), 0);
    }
    wasOpen.current = !!ref;
    if (ref) setTimeout(() => dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(), 0);
  }, [ref?.kind, ref?.id]);

  useEffect(() => {
    if (!ref) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Tab" && dialogRef.current) {
        const f = [...dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.hasAttribute("disabled"));
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ref, close]);

  if (!ref) return null;
  return (
    <>
      <div className="scrim" onClick={close} aria-hidden="true" />
      <div className="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title" ref={dialogRef}>
        <div className="panel__bar">
          {panel.length > 1 ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={back}><IconArrowLeft size={16} /> Back</button>
          ) : <span />}
          <button type="button" className="iconbtn" onClick={close} aria-label="Close details"><IconX size={20} /></button>
        </div>
        <div className="panel__body">
          <PanelContent r={ref} />
        </div>
      </div>
    </>
  );
}

function PanelTitle({ kicker, children, extra }: { kicker: React.ReactNode; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <header className="panel__head">
      <p className="panel__kicker">{kicker}</p>
      <h2 className="panel__title" id="panel-title" tabIndex={-1} data-autofocus>{children}</h2>
      {extra && <div className="panel__extra">{extra}</div>}
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="psec"><h3 className="psec__title">{title}</h3>{children}</section>;
}

function EventRow({ e }: { e: HealthcareEvent }) {
  const { repo, t } = useApp();
  return (
    <li>
      <RecordLink to={{ kind: "event", id: e.id }} className="evrow">
        <span className="evrow__date"><DateText d={e.occurredAt} /></span>
        <span className="evrow__title">{e.title}</span>
        <span className="evrow__meta">{e.eventType} · {repo.svcName(e.serviceId)} · <StatusPill status={e.status} size="sm" /></span>
      </RecordLink>
    </li>
  );
}

function PanelContent({ r }: { r: PanelRef }) {
  switch (r.kind) {
    case "landmark": return <LandmarkDetail id={r.id} />;
    case "event": return <EventDetail id={r.id} />;
    case "referral": return <ReferralDetail id={r.id} />;
    case "medication": return <MedicationDetail id={r.id} />;
    case "document": return <DocumentDetail id={r.id} />;
    case "appointment": return <AppointmentDetail id={r.id} />;
    case "action": return <ActionDetail id={r.id} />;
    case "gap": return <GapDetail id={r.id} />;
    case "source": return <SourceDetail id={r.id} />;
    case "episode": return <EpisodeDetail id={r.id} />;
    case "service": return <ServiceDetail id={r.id} />;
    case "organisation": return <OrgDetail id={r.id} />;
  }
}

function ShowOnJourney({ lmId }: { lmId?: string }) {
  const { showOnJourney, landmarks } = useApp();
  if (!lmId) return null;
  const v = landmarks.find((x) => x.lm.id === lmId);
  return (
    <button type="button" className="btn btn--sm" onClick={() => showOnJourney(lmId)}>
      <IconMap size={16} /> Show on journey{v ? `: ${v.lm.title}` : ""}
    </button>
  );
}

// --------------------------------------------------------------------------- landmark
function nextActionFor(v: LandmarkVM, repo: ReturnType<typeof useApp>["repo"]) {
  const evIds = new Set(v.events.map((e) => e.id));
  v.episode?.relatedEventIds.forEach((i) => evIds.add(i));
  v.referral?.linkedEventIds.forEach((i) => evIds.add(i));
  const actions = repo.ds.actions.filter((a) => a.sourceEventIds.some((s) => evIds.has(s)) && a.status !== "Completed");
  const futureEvents = [...evIds].map((i) => repo.event(i)!).filter((e) => e && isFuture(e.occurredAt));
  return { actions, futureEvents };
}

function LandmarkDetail({ id }: { id: string }) {
  const { landmarks, repo, mode, t } = useApp();
  const v = landmarks.find((x) => x.lm.id === id);
  if (!v) return <EmptyState title="Landmark not found" />;
  const meta = TYPE_META[v.lm.landmarkType];
  const ep = v.episode;
  const ref = v.referral;
  const primary = v.events.find((e) => e.id === v.primaryEventId);
  const outcome = ep?.outcome ?? ref?.outcome ?? primary?.outcome;
  const services = v.serviceIds.map((s) => repo.service(s)!).filter(Boolean);
  const docs = v.events.flatMap((e) => repo.documentsForEvent(e.id));
  const { actions, futureEvents } = nextActionFor(v, repo);
  const epEvents = ep ? repo.events(ep.relatedEventIds) : v.events;
  const sources = [...new Set(v.events.map((e) => e.sourceRecordId))].map((s) => repo.source(s)!).filter(Boolean);

  return (
    <>
      <PanelTitle
        kicker={<><span className="panel__glyph"><LandmarkGlyph type={v.lm.landmarkType} variant={v.lm.visualVariant} status={v.status} hasGap={v.gaps.length > 0} size={40} /></span>{meta.label} · {mode === "patient" ? meta.plainMeaning : meta.meaning}</>}
        extra={<><LandmarkStatusPill status={v.status} label={v.statusLabel} />{v.isCurrent && <span className="pill pill--current">Most recent recorded stage</span>}{v.isOverseas && <SectorTag sector="Overseas" />}{v.isPrivate && <SectorTag sector="Private" />}</>}
      >
        {mode === "patient" && ep?.plainTitle ? ep.plainTitle : v.lm.title}
      </PanelTitle>
      {v.lm.description && <p className="panel__lede">{v.lm.description}</p>}
      {mode === "patient" && !ep && primary?.plainSummary && <p className="panel__lede">{primary.plainSummary}</p>}

      <Section title={mode === "patient" ? "At a glance" : "Summary"}>
        <KV items={[
          [mode === "patient" ? "What kind of step" : "Stage / event type", ep ? `${ep.episodeKind} care episode` : v.lm.landmarkType === "bridge" ? "Handover between services" : ref ? "Referral" : primary?.eventType],
          [services.length > 1 ? "Services" : "Service", services.map((s) => <div key={s.id}><RecordLink to={{ kind: "service", id: s.id }}>{s.name}</RecordLink> <span className="muted">· {repo.orgName(s.organisationId)}</span></div>)],
          [ep ? "Started" : v.lm.landmarkType === "signpost" ? "Sent" : "Date", v.start ? <DateText d={v.start} /> : <span className="muted">Start date not recorded</span>],
          [ep ? "Ended" : v.lm.landmarkType === "signpost" ? "Decision" : undefined, !(ep || v.lm.landmarkType === "signpost") ? undefined : v.end ? <DateText d={v.end} /> : !ep ? <span className="warn-text">No decision recorded</span> : v.status === "ongoing" ? "Ongoing — no end date recorded" : v.status === "upcoming" ? "Not yet taken place" : v.lm.landmarkType === "campsite" ? <span className="muted">End date not recorded</span> : undefined],
          [ep ? "Duration" : undefined, v.duration ? <><strong>{v.duration.label}</strong><br /><span className="muted small">{v.duration.detail}</span></> : undefined],
          [ref ? "Waiting for a decision" : undefined, v.waitDays !== undefined ? `${fmtDays(v.waitDays)} (received ${fmtDate(ref?.receivedAt)} → decision ${fmtDate(ref?.decisionAt)})` : ref && ref.receivedAt && !ref.decisionAt ? `No decision recorded yet — ${daysBetween(ref.receivedAt, DEMO_TODAY)} days since received` : undefined],
          ["Status", <LandmarkStatusPill status={v.status} label={v.statusLabel} />],
          ["Outcome", outcome ?? <span className="muted">No outcome recorded</span>],
        ]} />
      </Section>

      {ref && (
        <Section title={mode === "patient" ? "About this referral" : "Referral record"}>
          <ReferralSummary refId={ref.id} />
          <RecordLink to={{ kind: "referral", id: ref.id }}>Open full referral record <IconChevronRight size={14} /></RecordLink>
        </Section>
      )}

      {v.lm.landmarkType === "bridge" && (
        <Section title={mode === "patient" ? "Handover" : "Transfer / handover"}>
          <BridgeSummary v={v} />
        </Section>
      )}

      <Section title={ep ? (mode === "patient" ? "Visits and events during this period" : "Events in this episode") : "Linked events"}>
        <ul className="evlist">{epEvents.map((e) => <EventRow key={e.id} e={e} />)}</ul>
      </Section>

      <Section title={mode === "patient" ? "What happens next" : "Next recorded action"}>
        {actions.length === 0 && futureEvents.length === 0 ? (
          <p className="muted">{v.status === "completed" ? "This stage is complete. No further action is recorded for it." : "No next step is recorded for this stage."}</p>
        ) : (
          <ul className="plain">
            {futureEvents.map((e) => <li key={e.id}><RecordLink to={{ kind: "event", id: e.id }}>{e.title}</RecordLink> — <DateText d={e.occurredAt} /> <StatusPill status={e.status} size="sm" /></li>)}
            {actions.map((a) => <li key={a.id}><RecordLink to={{ kind: "action", id: a.id }}>{mode === "patient" ? a.plainTitle ?? a.title : a.title}</RecordLink> — {a.responsibleRoleId ?? <em>responsible role not recorded</em>}{a.dueAt ? `, by ${fmtDate(a.dueAt)}` : a.dueText ? `, ${a.dueText}` : ""} <StatusPill status={a.status} size="sm" /></li>)}
          </ul>
        )}
      </Section>

      {v.gaps.length > 0 && (
        <Section title={mode === "patient" ? "What isn't clear in the records" : "Missing or conflicting information"}>
          <div className="stack">{v.gaps.map((g) => <GapCallout key={g.id} gap={g} />)}</div>
        </Section>
      )}

      <Section title="Supporting records">
        {docs.length ? (
          <ul className="plain">{docs.map((d) => <li key={d.id}><IconFile size={14} /> <RecordLink to={{ kind: "document", id: d.id }}>{d.title}</RecordLink> <StatusPill status={d.availabilityStatus} size="sm" /></li>)}</ul>
        ) : <p className="muted">No documents are linked to this stage.</p>}
        {mode === "pro" && (
          <p className="small muted prov"><IconDatabase size={14} /> Sources: {sources.map((s, i) => <React.Fragment key={s.id}>{i > 0 && ", "}<RecordLink to={{ kind: "source", id: s.id }}>{s.sourceType} ({repo.orgName(s.organisationId)})</RecordLink></React.Fragment>)}</p>
        )}
      </Section>
      {ep && <p className="small muted">{DURATION_CONVENTION}</p>}
    </>
  );
}

function BridgeSummary({ v }: { v: LandmarkVM }) {
  const { repo } = useApp();
  const evs = [...v.events].sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : 1));
  const from = evs[0], to = evs[evs.length - 1];
  const ref = v.referral;
  const fromSvc = ref ? ref.referringServiceId : from?.serviceId;
  const toSvc = ref ? ref.receivingServiceId : to?.serviceId;
  const transfer = evs.find((e) => e.eventType === "Discharge" || e.eventType === "Admission" || e.eventType === "Ward transfer") ?? from;
  return (
    <>
      <div className="handover">
        <div className="handover__end"><span className="muted small">From</span><strong>{repo.svcName(fromSvc)}</strong><span className="small">{repo.svcOrg(fromSvc)?.name}</span></div>
        <IconArrowRight size={22} />
        <div className="handover__end"><span className="muted small">To</span><strong>{repo.svcName(toSvc)}</strong><span className="small">{repo.svcOrg(toSvc)?.name}</span></div>
      </div>
      <KV items={[
        ["Date of handover", <DateText d={transfer?.occurredAt} />],
        ["Transfer / discharge event", transfer && <RecordLink to={{ kind: "event", id: transfer.id }}>{transfer.title}</RecordLink>],
        ["Receiving service status", ref ? (ref.receivedAt ? `Received ${fmtDate(ref.receivedAt)}${ref.decisionAt ? `; accepted ${fmtDate(ref.decisionAt)}` : ""}` : <StatusPill status="Receipt not recorded" />) : to && to.serviceId !== from?.serviceId ? `Recorded by ${repo.svcName(to.serviceId)} (${fmtDate(to.occurredAt)})` : "Handover recorded"],
        ["Known follow-up", (() => { const f = repo.ds.events.filter((e) => toSvc && e.serviceId === toSvc && transfer && e.occurredAt > transfer.occurredAt).slice(0, 1)[0]; return f ? <RecordLink to={{ kind: "event", id: f.id }}>{f.title} ({fmtDate(f.occurredAt)})</RecordLink> : <span className="muted">No follow-up contact recorded</span>; })()],
        ["Discharge destination", transfer?.metadata?.dischargeDestination],
      ]} />
    </>
  );
}

function ReferralSummary({ refId }: { refId: string }) {
  const { repo, mode } = useApp();
  const r = repo.referral(refId)!;
  return (
    <KV items={[
      [mode === "pro" ? "Referral ID" : undefined, <code>{refLabel(r.id)}</code>],
      ["From", repo.svcLabel(r.referringServiceId)],
      ["To", repo.svcLabel(r.receivingServiceId)],
      ["Sent", r.sentAt ? fmtDate(r.sentAt) : "Not recorded"],
      ["Received", r.receivedAt ? fmtDate(r.receivedAt) : <span className="warn-text">Not recorded by receiving service</span>],
      ["Decision", r.decisionAt ? fmtDate(r.decisionAt) : <span className="warn-text">No decision recorded</span>],
      ["Reason", r.reason],
      ["Priority", r.priority],
      ["Status", <StatusPill status={r.currentStatus} />],
      ["Outcome", r.outcome ?? <span className="muted">No outcome recorded</span>],
    ]} />
  );
}

// --------------------------------------------------------------------------- event
function EventDetail({ id }: { id: string }) {
  const { repo, mode, gaps } = useApp();
  const e = repo.event(id);
  if (!e) return <EmptyState title="Event not found" />;
  const org = repo.organisation(e.organisationId);
  const src = repo.source(e.sourceRecordId);
  const docs = repo.documentsForEvent(e.id);
  const meds = repo.medsForEvent(e.id);
  const related = repo.relatedEvents(e.id);
  const actions = repo.actionsForEvent(e.id);
  const lm = repo.landmarkForEvent(e.id);
  const evGaps = gaps.filter((g) => g.refs.some((r) => r.kind === "event" && r.id === e.id));
  const refs = e.relatedReferralIds.map((r) => repo.referral(r)!).filter(Boolean);
  const appt = repo.appointmentForEvent(e.id);
  return (
    <>
      <PanelTitle kicker={e.eventType} extra={<><StatusPill status={e.status} />{org && <SectorTag sector={org.sector} jurisdiction={org.jurisdiction} />}</>}>{e.title}</PanelTitle>
      <p className="panel__lede">{mode === "patient" ? e.plainSummary ?? e.summary : e.summary}</p>
      <div className="panel__actions"><ShowOnJourney lmId={lm?.id} /></div>
      <Section title="Details">
        <KV items={[
          ["Date and time", <><DateText d={e.occurredAt} />{e.endedAt && <> – <DateText d={e.endedAt} /></>}</>],
          [e.metadata?.durationMinutes ? "Appointment length" : undefined, e.metadata?.durationMinutes ? `${e.metadata.durationMinutes} minutes (recorded contact time)` : undefined],
          ["Provider", org && <RecordLink to={{ kind: "organisation", id: org.id }}>{org.name}</RecordLink>],
          ["Location", e.metadata?.location ?? appt?.location ?? org?.location],
          ["Service or team", <RecordLink to={{ kind: "service", id: e.serviceId }}>{repo.svcName(e.serviceId)}</RecordLink>],
          [e.metadata?.referringServiceId ? "Referring service" : undefined, repo.svcLabel(e.metadata?.referringServiceId)],
          [e.metadata?.receivingServiceId ? "Receiving service" : undefined, repo.svcLabel(e.metadata?.receivingServiceId)],
          ["Arrival method", e.metadata?.arrivalMethod],
          ["Recorded reason", e.metadata?.reason],
          ["Status", <StatusPill status={e.status} />],
          ["Outcome", e.outcome ?? <span className="muted">No outcome recorded</span>],
          ["Discharge destination", e.metadata?.dischargeDestination],
          ["Responsible role", e.metadata?.responsibleRole ?? e.metadata?.clinician],
          [mode === "pro" ? "Jurisdiction" : undefined, org?.jurisdiction],
        ]} />
      </Section>
      {refs.length > 0 && <Section title="Related referrals"><ul className="plain">{refs.map((r) => <li key={r.id}><RecordLink to={{ kind: "referral", id: r.id }}>Referral to {repo.svcName(r.receivingServiceId)}</RecordLink> <StatusPill status={r.currentStatus} size="sm" /></li>)}</ul></Section>}
      {meds.length > 0 && <Section title="Associated medications"><ul className="plain">{meds.map((m) => <li key={m.id}><RecordLink to={{ kind: "medication", id: m.id }}>{m.medicationName} {m.recordedDose}</RecordLink> <StatusPill status={m.status} size="sm" /></li>)}</ul></Section>}
      {docs.length > 0 && <Section title="Associated documents"><ul className="plain">{docs.map((d) => <li key={d.id}><IconFile size={14} /> <RecordLink to={{ kind: "document", id: d.id }}>{d.title}</RecordLink> <StatusPill status={d.availabilityStatus} size="sm" /></li>)}</ul></Section>}
      {related.length > 0 && <Section title="Related events"><ul className="evlist">{related.map((x) => <EventRow key={x.id} e={x} />)}</ul></Section>}
      {actions.length > 0 && <Section title="Follow-up actions"><ul className="plain">{actions.map((a) => <li key={a.id}><RecordLink to={{ kind: "action", id: a.id }}>{mode === "patient" ? a.plainTitle ?? a.title : a.title}</RecordLink> <StatusPill status={a.status} size="sm" /></li>)}</ul></Section>}
      {evGaps.length > 0 && <Section title={mode === "patient" ? "What isn't clear in the records" : "Information gaps"}><div className="stack">{evGaps.map((g) => <GapCallout key={g.id} gap={g} />)}</div></Section>}
      <Section title="Record source">
        <KV items={[
          ["Source", src && <RecordLink to={{ kind: "source", id: src.id }}>{src.sourceType}</RecordLink>],
          ["Event date", fmtDateTime(e.occurredAt)],
          ["Recorded", fmtDateTime(e.recordedAt)],
          [e.receivedAt ? "Received / imported" : undefined, e.receivedAt ? fmtDateTime(e.receivedAt) : undefined],
          ["Verification", src && <StatusPill status={src.verificationStatus} size="sm" />],
          ["Last updated", src && fmtDateTime(src.lastUpdatedAt)],
          [mode === "pro" ? "Record ID" : undefined, <code>{e.id}</code>],
        ]} />
      </Section>
    </>
  );
}

// --------------------------------------------------------------------------- referral
function ReferralDetail({ id }: { id: string }) {
  const { repo, mode, gaps } = useApp();
  const r = repo.referral(id);
  if (!r) return <EmptyState title="Referral not found" />;
  const lm = repo.landmarkForReferral(r.id);
  const g = gaps.filter((x) => x.refs.some((y) => y.kind === "referral" && y.id === r.id));
  const appts = repo.ds.appointments.filter((a) => a.linkedReferralId === r.id);
  const wait = r.receivedAt && r.decisionAt ? calcDuration(r.receivedAt, r.decisionAt) : r.receivedAt ? calcDuration(r.receivedAt, undefined, true) : undefined;
  return (
    <>
      <PanelTitle kicker={<>Referral · <code>{refLabel(r.id)}</code></>} extra={<StatusPill status={r.currentStatus} />}>
        {repo.svcName(r.referringServiceId)} → {repo.svcName(r.receivingServiceId)}
      </PanelTitle>
      {mode === "patient" && (
        <p className="panel__lede">
          {r.receivedAt && !r.decisionAt
            ? `Your referral has been received. ${repo.svcName(r.receivingServiceId)} has not yet recorded a decision or an assessment appointment.`
            : !r.receivedAt
            ? `Your referral was sent on ${fmtDate(r.sentAt)}. There is no record yet that ${repo.svcName(r.receivingServiceId)} received it.`
            : `This referral was received and a decision was recorded on ${fmtDate(r.decisionAt)}.`}
        </p>
      )}
      <div className="panel__actions"><ShowOnJourney lmId={lm?.id} /></div>
      <Section title="Referral"><ReferralSummary refId={r.id} /></Section>
      <Section title="Timing">
        <KV items={[
          ["Created", fmtDate(r.createdAt)],
          ["Sent → received", r.sentAt && r.receivedAt ? fmtDays(daysBetween(r.sentAt, r.receivedAt)) : "Cannot be calculated (date missing)"],
          ["Waiting for decision", wait ? (wait.kind === "ongoing" ? `${wait.days} days so far — no decision recorded` : wait.label) : "Cannot be calculated (received date missing)"],
          ["Responsible role", r.responsibleRoleId ?? <span className="muted">Not recorded</span>],
          ["Last updated", fmtDateTime(r.lastUpdatedAt)],
        ]} />
        <p className="small muted">The waiting time is the number of calendar days between the dates shown. No referral is labelled overdue: no documented deadline exists in this record.</p>
      </Section>
      <Section title="Status history">
        <ol className="steps">
          {r.statusHistory.map((s, i) => <li key={i}><span className="steps__dot" aria-hidden="true" /><strong>{s.status}</strong> <span className="muted">{fmtDate(s.at)}</span>{s.note && <span className="small"> — {s.note}</span>}</li>)}
          {(r.currentStatus === "Awaiting review" || r.currentStatus === "Received" || r.currentStatus === "Sent") && <li className="steps__pending"><span className="steps__dot" aria-hidden="true" /><em>Next status not yet recorded</em></li>}
        </ol>
      </Section>
      {appts.length > 0 && <Section title="Linked appointments"><ul className="plain">{appts.map((a) => <li key={a.id}><RecordLink to={{ kind: "appointment", id: a.id }}>{a.appointmentType}</RecordLink> — {fmtDateTime(a.scheduledAt)} <StatusPill status={a.status} size="sm" /></li>)}</ul></Section>}
      <Section title="Related events"><ul className="evlist">{repo.events(r.linkedEventIds).map((e) => <EventRow key={e.id} e={e} />)}</ul></Section>
      {g.length > 0 && <Section title="Information gaps"><div className="stack">{g.map((x) => <GapCallout key={x.id} gap={x} />)}</div></Section>}
      <Section title="Record source"><KV items={[["Source", <RecordLink to={{ kind: "source", id: r.sourceRecordId }}>{repo.source(r.sourceRecordId)?.sourceType}</RecordLink>]]} /></Section>
    </>
  );
}

// --------------------------------------------------------------------------- medication
function MedicationDetail({ id }: { id: string }) {
  const { repo, gaps, mode } = useApp();
  const m = repo.medication(id);
  if (!m) return <EmptyState title="Medication record not found" />;
  const history = repo.medGroup(m.medicationGroup);
  const g = gaps.filter((x) => x.refs.some((y) => y.kind === "medication" && history.some((h) => h.id === y.id)));
  const src = repo.source(m.sourceRecordId);
  return (
    <>
      <PanelTitle kicker="Medication record" extra={<><StatusPill status={m.status} /><span className="tag">{m.recordType}</span></>}>{m.medicationName} {m.recordedDose}</PanelTitle>
      {mode === "patient" && <p className="panel__lede small">This page shows what has been recorded. It is not advice about taking your medicines. Please speak to your GP practice or pharmacist before making any change.</p>}
      <Section title="Record">
        <KV items={[
          ["Medicine", m.medicationName], ["Recorded dose", m.recordedDose], ["Route", m.route], ["Frequency", m.frequency],
          ["Start date", m.startDate ? fmtDate(m.startDate) : <span className="muted">Not recorded</span>],
          ["End date", m.endDate ? fmtDate(m.endDate) : m.status === "Active" || m.status === "Awaiting reconciliation" ? "No end date recorded" : <span className="muted">Not recorded</span>],
          ["Status", <StatusPill status={m.status} />],
          ["Recorded by", repo.orgName(m.organisationId)],
          ["Source", src && <RecordLink to={{ kind: "source", id: src.id }}>{src.sourceType}</RecordLink>],
          ["Last updated", fmtDateTime(m.lastUpdatedAt)],
          ["Note", m.note],
        ]} />
      </Section>
      {g.length > 0 && <Section title={mode === "patient" ? "Records that don't match" : "Discrepancy"}><div className="stack">{g.map((x) => <GapCallout key={x.id} gap={x} />)}</div></Section>}
      <Section title={`History of ${m.medicationName} records`}>
        <ol className="medhist">
          {history.map((h) => (
            <li key={h.id} className={h.id === m.id ? "is-current" : ""}>
              <RecordLink to={{ kind: "medication", id: h.id }}><strong>{h.recordedDose}</strong> · {h.frequency}</RecordLink>
              <span className="small">{h.startDate ? fmtDate(h.startDate) : "start not recorded"} – {h.endDate ? fmtDate(h.endDate) : "no end date"} · {repo.orgName(h.organisationId)} ({h.recordType.toLowerCase()})</span>
              <StatusPill status={h.status} size="sm" />
            </li>
          ))}
        </ol>
      </Section>
      <Section title="Related events"><ul className="evlist">{repo.events(m.linkedEventIds).map((e) => <EventRow key={e.id} e={e} />)}</ul></Section>
    </>
  );
}

// --------------------------------------------------------------------------- document
function DocumentDetail({ id }: { id: string }) {
  const { repo, mode } = useApp();
  const d = repo.document(id);
  if (!d) return <EmptyState title="Document not found" />;
  const e = d.eventId ? repo.event(d.eventId) : undefined;
  const lm = d.eventId ? repo.landmarkForEvent(d.eventId) : undefined;
  return (
    <>
      <PanelTitle kicker={d.documentType} extra={<StatusPill status={d.availabilityStatus} />}>{d.title}</PanelTitle>
      <div className="panel__actions"><ShowOnJourney lmId={lm?.id} /></div>
      <KV items={[
        ["Source organisation", repo.orgName(d.organisationId)],
        ["Document date", d.documentDate ? fmtDate(d.documentDate) : <span className="muted">Not recorded</span>],
        ["Received / imported", d.receivedAt ? fmtDateTime(d.receivedAt) : <span className="muted">Not received</span>],
        ["Associated event", e && <RecordLink to={{ kind: "event", id: e.id }}>{e.title} ({fmtDate(e.occurredAt)})</RecordLink>],
        ["Language", d.language],
        ["Author", d.author],
      ]} />
      {d.availabilityStatus === "Referenced, not received" ? (
        <div className="notice notice--attention">
          <IconAlert size={18} />
          <div>
            <strong>This document is not available.</strong>
            <p>It is mentioned in the record, but no copy has been received from {repo.orgName(d.organisationId)}. {mode === "patient" ? "You can ask them for a copy." : "Request a copy from the authoring organisation."} There is nothing to download.</p>
          </div>
        </div>
      ) : (
        <article className="docpreview" aria-label="Document preview">
          <div className="docpreview__head">
            <strong>{repo.orgName(d.organisationId)}</strong>
            <span>{d.documentDate ? fmtDate(d.documentDate, { long: true }) : ""}</span>
          </div>
          <p className="docpreview__re"><strong>Re:</strong> {repo.patient.displayName}, DOB {fmtDate(repo.patient.dateOfBirth)} — synthetic record</p>
          {(d.syntheticContent ?? "").split("\n\n").map((p, i) => <p key={i} style={{ whiteSpace: "pre-line" }}>{p}</p>)}
          <p className="docpreview__foot">Synthetic demonstration document — not a real clinical record.</p>
        </article>
      )}
      {d.availabilityStatus === "Partially available" && <p className="small warn-text">Part of this document is missing or untranslated. See the note above.</p>}
    </>
  );
}

// --------------------------------------------------------------------------- appointment
function AppointmentDetail({ id }: { id: string }) {
  const { repo, open, gaps } = useApp();
  const a = repo.appointment(id);
  if (!a) return <EmptyState title="Appointment not found" />;
  const lm = a.eventId ? repo.landmarkForEvent(a.eventId) : undefined;
  const g = gaps.filter((x) => x.refs.some((y) => y.kind === "appointment" && y.id === a.id));
  const svc = repo.service(a.serviceId);
  const org = repo.organisation(a.organisationId);
  return (
    <>
      <PanelTitle kicker={a.appointmentType} extra={<StatusPill status={a.status} />}>{svc?.name}</PanelTitle>
      <div className="panel__actions"><ShowOnJourney lmId={lm?.id} /></div>
      <KV items={[
        ["Date and time", fmtDateTime(a.scheduledAt, { weekday: true })],
        ["Length", a.durationMinutes ? `${a.durationMinutes} minutes` : undefined],
        ["Provider", org?.name], ["Service", svc?.name], ["Location", a.location], ["With", a.clinicianRole],
        ["Status", <StatusPill status={a.status} />],
        ["Outcome", a.outcome ?? <span className="muted">No outcome recorded</span>],
        ["Linked referral", a.linkedReferralId && <RecordLink to={{ kind: "referral", id: a.linkedReferralId }}>Referral {refLabel(a.linkedReferralId)}</RecordLink>],
        ["Follow-up", a.followUpEventIds.length ? repo.events(a.followUpEventIds).map((e) => <div key={e.id}><RecordLink to={{ kind: "event", id: e.id }}>{e.title}</RecordLink> ({fmtDate(e.occurredAt)})</div>) : <span className="muted">None recorded</span>],
        ["Contact", svc?.contactDetails?.phone ?? org?.contactDetails.phone],
      ]} />
      {a.eventId && <p><RecordLink to={{ kind: "event", id: a.eventId }}>Open event record <IconChevronRight size={14} /></RecordLink></p>}
      {g.length > 0 && <Section title="Information gaps"><div className="stack">{g.map((x) => <GapCallout key={x.id} gap={x} />)}</div></Section>}
    </>
  );
}

// --------------------------------------------------------------------------- action
function ActionDetail({ id }: { id: string }) {
  const { repo, mode, gaps } = useApp();
  const a = repo.action(id);
  if (!a) return <EmptyState title="Action not found" />;
  const g = gaps.filter((x) => x.refs.some((y) => y.kind === "action" && y.id === a.id));
  const svc = repo.service(a.responsibleServiceId);
  return (
    <>
      <PanelTitle kicker="Recorded next step" extra={<StatusPill status={a.status} />}>{mode === "patient" ? a.plainTitle ?? a.title : a.title}</PanelTitle>
      <p className="panel__lede">{a.description}</p>
      <KV items={[
        ["Responsible", a.responsibleRoleId ?? <span className="warn-text">Not recorded</span>],
        ["Contact", svc?.contactDetails?.phone ?? repo.organisation(svc?.organisationId)?.contactDetails.phone],
        ["When", a.dueAt ? `${fmtDate(a.dueAt)}${a.dueText ? ` (${a.dueText})` : ""}` : a.dueText ?? <span className="muted">No date or timeframe recorded</span>],
        ["Status", <StatusPill status={a.status} />],
        ["Recorded", fmtDate(a.createdAt)], ["Last updated", fmtDate(a.updatedAt)],
      ]} />
      <Section title="Source events"><ul className="evlist">{repo.events(a.sourceEventIds).map((e) => <EventRow key={e.id} e={e} />)}</ul></Section>
      {g.length > 0 && <Section title="Information gaps"><div className="stack">{g.map((x) => <GapCallout key={x.id} gap={x} />)}</div></Section>}
      <p className="small muted">This is a step recorded in the source records. Pathways does not create clinical plans or assign responsibility.</p>
    </>
  );
}

// --------------------------------------------------------------------------- gap
function GapDetail({ id }: { id: string }) {
  const { gaps, mode, open, landmarks } = useApp();
  const g = gaps.find((x) => x.id === id);
  if (!g) return <EmptyState title="Finding not found" />;
  const rule = RULES.find((r) => r.id === g.ruleId)!;
  return (
    <>
      <PanelTitle kicker={mode === "patient" ? "Something missing or unclear" : `${g.category} · Rule ${g.ruleId}`} extra={<StatusPill tone={g.category === "Information incomplete" ? "neutral" : "attention"} label={g.category} />}>{mode === "patient" ? g.plainTitle : g.title}</PanelTitle>
      {mode === "patient" ? (
        <>
          <p className="panel__lede">{g.plainExplanation}</p>
          <div className="notice notice--info"><div><strong>This is about the records, not about you.</strong><p>A gap in the records does not mean care didn't happen or that anything has gone wrong. It means the information we hold doesn't show it yet. If you're unsure, contact {g.reviewer ?? "your GP practice"}.</p></div></div>
        </>
      ) : (
        <>
          <Section title="1. What was found"><p>{g.whatFound}</p></Section>
          <Section title="2. Why it matters"><p>{g.whyMatters}</p></Section>
          <Section title="3. Records involved"><ul className="plain">{g.refs.map((r, i) => <li key={i}><RecordLink to={{ kind: r.kind, id: r.id }}>{r.label}</RecordLink> <span className="muted small">({r.kind})</span></li>)}</ul></Section>
          <Section title="4. What is missing or inconsistent"><p>{g.missing}</p></Section>
          <Section title="5. Who should review"><p>{g.reviewer ?? <span className="warn-text">Not known from the record</span>}</p></Section>
          <Section title="6. Appropriate next action"><p>{g.nextAction}</p></Section>
          <Section title="How this was detected"><p className="small"><strong>{rule.id}: {rule.name}.</strong> {rule.logic}</p><p className="small muted">Findings describe documentation only. Incomplete documentation does not prove that care was not provided.</p></Section>
        </>
      )}
      <div className="panel__actions">
        {g.landmarkIds.map((l) => <ShowOnJourney key={l} lmId={l} />)}
      </div>
      {mode === "patient" && <Section title="Records involved"><ul className="plain">{g.refs.map((r, i) => <li key={i}><RecordLink to={{ kind: r.kind, id: r.id }}>{r.label}</RecordLink></li>)}</ul></Section>}
    </>
  );
}

// --------------------------------------------------------------------------- source / episode / service / org
function SourceDetail({ id }: { id: string }) {
  const { repo } = useApp();
  const s = repo.source(id);
  if (!s) return <EmptyState title="Source not found" />;
  const evs = repo.ds.events.filter((e) => e.sourceRecordId === s.id);
  return (
    <>
      <PanelTitle kicker="Record source (provenance)" extra={<StatusPill status={s.verificationStatus} />}>{s.sourceType}</PanelTitle>
      <KV items={[["Organisation", repo.orgName(s.organisationId)], ["Jurisdiction", s.jurisdiction], ["Reference", <code>{s.sourceReference}</code>], ["Received", fmtDateTime(s.receivedAt)], ["Last updated", fmtDateTime(s.lastUpdatedAt)], ["Verification", s.verificationStatus], ["Note", s.note]]} />
      <Section title={`Events from this source (${evs.length})`}><ul className="evlist">{evs.map((e) => <EventRow key={e.id} e={e} />)}</ul></Section>
      <p className="small muted">Synthetic provenance. No live system is connected.</p>
    </>
  );
}

function EpisodeDetail({ id }: { id: string }) {
  const { repo } = useApp();
  const lm = repo.landmarkForEpisode(id);
  if (lm) return <LandmarkDetail id={lm.id} />;
  const ep = repo.episode(id);
  if (!ep) return <EmptyState title="Episode not found" />;
  const d = calcDuration(ep.startDate, ep.endDate, ep.status === "Ongoing");
  return (
    <>
      <PanelTitle kicker="Care episode" extra={<StatusPill status={ep.status} />}>{ep.title}</PanelTitle>
      <KV items={[["Start", ep.startDate ? fmtDate(ep.startDate) : "Not recorded"], ["End", ep.endDate ? fmtDate(ep.endDate) : "Not recorded"], ["Duration", d.label]]} />
      <ul className="evlist">{repo.events(ep.relatedEventIds).map((e) => <EventRow key={e.id} e={e} />)}</ul>
    </>
  );
}

function ServiceDetail({ id }: { id: string }) {
  const { repo, mode } = useApp();
  const s = repo.service(id);
  if (!s) return <EmptyState title="Service not found" />;
  const org = repo.organisation(s.organisationId)!;
  const team = repo.teamForService(id);
  const evs = repo.eventsForService(id);
  const refs = repo.referralsForService(id);
  const period = team ? calcDuration(team.startDate, team.endDate, team.involvementStatus === "Current") : undefined;
  return (
    <>
      <PanelTitle kicker={s.serviceType} extra={<><SectorTag sector={org.sector} jurisdiction={org.jurisdiction} />{team && <StatusPill status={team.involvementStatus} />}</>}>{s.name}</PanelTitle>
      <p className="panel__lede">{s.description}</p>
      <KV items={[
        ["Organisation", <RecordLink to={{ kind: "organisation", id: org.id }}>{org.name}</RecordLink>],
        ["Role in this journey", team?.roleInJourney],
        ["Responsibility", team?.responsibilityDescription],
        ["Period of involvement", team ? `${team.startDate ? fmtDate(team.startDate) : "Start not recorded"} – ${team.endDate ? fmtDate(team.endDate) : team.involvementStatus === "Current" ? "ongoing" : "not recorded"}` : undefined],
        ["Duration", period?.label],
        ["Phone", s.contactDetails?.phone ?? org.contactDetails.phone],
      ]} />
      {evs.length > 0 && <Section title="Events with this service"><ul className="evlist">{evs.map((e) => <EventRow key={e.id} e={e} />)}</ul></Section>}
      {refs.length > 0 && <Section title="Referrals"><ul className="plain">{refs.map((r) => <li key={r.id}><RecordLink to={{ kind: "referral", id: r.id }}>{repo.svcName(r.referringServiceId)} → {repo.svcName(r.receivingServiceId)}</RecordLink> <StatusPill status={r.currentStatus} size="sm" /></li>)}</ul></Section>}
    </>
  );
}

function OrgDetail({ id }: { id: string }) {
  const { repo } = useApp();
  const o = repo.organisation(id);
  if (!o) return <EmptyState title="Organisation not found" />;
  const svcs = repo.ds.services.filter((s) => s.organisationId === id);
  return (
    <>
      <PanelTitle kicker={o.organisationType} extra={<SectorTag sector={o.sector} jurisdiction={o.jurisdiction} />}>{o.name}</PanelTitle>
      <KV items={[["Location", o.location], ["Jurisdiction", o.jurisdiction], ["Address", o.contactDetails.address], ["Phone", o.contactDetails.phone && <span><IconPhone size={14} /> {o.contactDetails.phone}</span>], ["Email", o.contactDetails.email], ["Hours", o.contactDetails.hours]]} />
      <Section title="Services involved"><ul className="plain">{svcs.map((s) => <li key={s.id}><RecordLink to={{ kind: "service", id: s.id }}>{s.name}</RecordLink></li>)}</ul></Section>
      <p className="small muted">Fictional organisation. Contact details are not real.</p>
    </>
  );
}
