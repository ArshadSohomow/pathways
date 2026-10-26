import React from "react";
import { useApp } from "../context";
import { Landscape } from "../components/Landscape";
import { Card, PageHeader, StatusPill, GapCallout, RecordLink, DateText, EmptyState } from "../components/common";
import { situation, nextSteps } from "../lib/summary";
import { fmtDate, fmtDateTime, relativeDays, fmtDays } from "../lib/dates";
import { IconCalendar, IconLink, IconPill, IconFlag, IconUsers, IconChevronRight, IconMap, IconSun, IconAlert } from "../components/icons";
import { refLabel } from "../lib/gaps";

export function Overview() {
  const { repo, mode, gaps, go, landmarks, open, showOnJourney } = useApp();
  const p = repo.patient;
  const s = situation(repo);
  const steps = nextSteps(repo);
  const current = landmarks.find((v) => v.isCurrent);
  const nextAppt = s.upcoming[0];
  const pro = mode === "pro";

  return (
    <>
      <PageHeader
        title={pro ? "Patient overview" : `Hello, ${p.preferredName ?? p.displayName}`}
        intro={pro ? `Journey across ${repo.ds.organisations.length} organisations, ${repo.ds.events.length} recorded events, ${repo.ds.referrals.length} referrals. ${gaps.length} information gap${gaps.length === 1 ? "" : "s"} detected.` : p.summaryForPatient}
      >
        <button type="button" className="btn" onClick={() => go("journey")}><IconMap size={16} /> {pro ? "Open Journey Explorer" : "Explore my journey"}</button>
      </PageHeader>

      <section className="hero-landscape" aria-labelledby="journey-heading">
        <div className="hero-landscape__head">
          <h2 id="journey-heading" className="section-title">{pro ? "Journey overview" : "Your journey so far"}</h2>
          <p className="muted small">{pro ? "Select any landmark for linked records. Full filters in Journey Explorer." : "Each landmark is a step in your care. Select one to see what happened, when and who was involved."}</p>
        </div>
        <Landscape compact />
        <div className="hero-landscape__foot">
          <button type="button" className="linkbtn" onClick={() => go("journey")}>Legend, filters and full timeline <IconChevronRight size={14} /></button>
        </div>
      </section>

      <div className="grid grid--2">
        <Card title={pro ? "Current situation" : "Where things stand"} icon={<IconSun size={18} />} id="sit">
          <dl className="sit">
            <div><dt>{pro ? "Current care status" : "Care you're receiving now"}</dt>
              <dd>{s.ongoing.length ? s.ongoing.map((e) => <div key={e.id}><RecordLink to={{ kind: "episode", id: e.id }}>{pro ? e.title : e.plainTitle ?? e.title}</RecordLink> <span className="muted small">since {e.startDate ? fmtDate(e.startDate) : "date not recorded"}</span></div>) : "No ongoing care periods are recorded."}</dd></div>
            <div><dt>{pro ? "Current recorded stage" : "Most recent step"}</dt>
              <dd>{current ? <><RecordLink to={{ kind: "landmark", id: current.lm.id }}>{current.lm.title}</RecordLink> <StatusPill status={current.statusLabel} size="sm" /></> : "Cannot be established from the records."}</dd></div>
            <div><dt>{pro ? "Most recently involved service" : "Last service you were in contact with"}</dt>
              <dd>{s.latestEvent ? <>{repo.svcName(s.latestEvent.serviceId)} <span className="muted small">({repo.orgName(s.latestEvent.organisationId)}, {fmtDate(s.latestEvent.occurredAt)})</span></> : "None recorded"}</dd></div>
            <div><dt>{pro ? "Latest significant event" : "Latest important event"}</dt>
              <dd>{s.latestSignificant ? <><RecordLink to={{ kind: "event", id: s.latestSignificant.id }}>{s.latestSignificant.title}</RecordLink> <span className="muted small">{fmtDate(s.latestSignificant.occurredAt)}</span></> : "None recorded"}</dd></div>
            <div><dt>{pro ? "Next confirmed appointment" : "Your next appointment"}</dt>
              <dd>{nextAppt ? <><RecordLink to={{ kind: "appointment", id: nextAppt.id }}>{repo.svcName(nextAppt.serviceId)}</RecordLink> — {fmtDateTime(nextAppt.scheduledAt, { weekday: true })} <span className="muted small">({relativeDays(nextAppt.scheduledAt)})</span></> : <strong>No upcoming appointment is recorded.</strong>}</dd></div>
            <div><dt>{pro ? "Outstanding items" : "Things still open"}</dt>
              <dd>{s.openActions.length} recorded next step{s.openActions.length === 1 ? "" : "s"} · {s.activeRefs.length} open referral{s.activeRefs.length === 1 ? "" : "s"} · {gaps.length} information gap{gaps.length === 1 ? "" : "s"}</dd></div>
          </dl>
          {gaps.length > 0 && (
            <div className="unknowns">
              <h3 className="unknowns__title"><IconAlert size={16} /> {pro ? "Not yet known from the record" : "What isn't known yet"}</h3>
              <ul>
                {gaps.slice(0, 4).map((g) => <li key={g.id}><button type="button" className="linkbtn" onClick={() => open({ kind: "gap", id: g.id })}>{pro ? g.title : g.plainTitle}</button></li>)}
              </ul>
              {gaps.length > 4 && <button type="button" className="linkbtn linkbtn--sm" onClick={() => go(pro ? "actions" : "journey")}>See all {gaps.length} <IconChevronRight size={12} /></button>}
            </div>
          )}
        </Card>

        <Card title="What happens next?" icon={<IconFlag size={18} />} id="next">
          {!nextAppt && <p className="notice notice--info"><span>No next appointment is recorded.</span></p>}
          {steps.length === 0 ? (
            <EmptyState title="No next steps recorded">The records do not contain any booked appointments or open actions.</EmptyState>
          ) : (
            <ol className="nextsteps">
              {steps.map((st) => {
                const lm = st.eventId ? repo.landmarkForEvent(st.eventId) : undefined;
                return (
                  <li key={st.key} className={st.confirmed ? "is-confirmed" : ""}>
                    <div className="nextsteps__when">
                      {st.when ? <><strong>{fmtDate(st.when).split(" ").slice(0, 2).join(" ")}</strong><span>{fmtDate(st.when).split(" ")[2]}</span></> : <span className="small">No date</span>}
                    </div>
                    <div className="nextsteps__body">
                      <p className="nextsteps__title">{pro ? st.title : st.plainTitle}</p>
                      <p className="small">
                        <span className="muted">Who: </span>{st.responsible ?? <span className="warn-text">Responsible service not recorded</span>}
                        {st.whenText && <><br /><span className="muted">When: </span>{st.whenText}</>}
                        {st.when && st.confirmed && <><br /><span className="muted">When: </span>{fmtDateTime(st.when, { weekday: true })}</>}
                        {st.contact && <><br /><span className="muted">Contact: </span>{st.contact}</>}
                      </p>
                      <div className="nextsteps__foot">
                        <StatusPill status={st.status} size="sm" />
                        {!st.confirmed && <span className="small muted">{pro ? "Recorded action — not a booked appointment" : "Planned in your records, not yet booked"}</span>}
                        {st.appointmentId && <RecordLink to={{ kind: "appointment", id: st.appointmentId }}>Details</RecordLink>}
                        {st.actionId && <RecordLink to={{ kind: "action", id: st.actionId }}>Details</RecordLink>}
                        {lm && <button type="button" className="linkbtn linkbtn--sm" onClick={() => showOnJourney(lm.id)}><IconMap size={12} /> On journey</button>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>

      <h2 className="section-title section-title--spaced">{pro ? "Summary" : "At a glance"}</h2>
      <div className="grid grid--cards">
        <Card title="Upcoming appointments" icon={<IconCalendar size={18} />} headingLevel={3} id="c1" action={<button className="linkbtn linkbtn--sm" type="button" onClick={() => go(pro ? "encounters" : "appointments")}>All <IconChevronRight size={12} /></button>}>
          {s.upcoming.length ? <ul className="mini">{s.upcoming.map((a) => <li key={a.id}><RecordLink to={{ kind: "appointment", id: a.id }}>{repo.svcName(a.serviceId)}</RecordLink><span className="small muted">{fmtDateTime(a.scheduledAt)}</span></li>)}</ul> : <p className="muted">None booked.</p>}
        </Card>
        <Card title={pro ? "Active referrals" : "Open referrals"} icon={<IconLink size={18} />} headingLevel={3} id="c2" action={pro ? <button className="linkbtn linkbtn--sm" type="button" onClick={() => go("referrals")}>All <IconChevronRight size={12} /></button> : undefined}>
          {s.activeRefs.length ? <ul className="mini">{s.activeRefs.map((r) => <li key={r.id}><RecordLink to={{ kind: "referral", id: r.id }}>{repo.svcName(r.receivingServiceId)}</RecordLink><span className="small"><StatusPill status={r.currentStatus} size="sm" /></span></li>)}</ul> : <p className="muted">None open.</p>}
        </Card>
        <Card title="Current medication records" icon={<IconPill size={18} />} headingLevel={3} id="c3" action={<button className="linkbtn linkbtn--sm" type="button" onClick={() => go("medications")}>All <IconChevronRight size={12} /></button>}>
          {s.currentMeds.length ? <ul className="mini">{s.currentMeds.map((m) => <li key={m.id}><RecordLink to={{ kind: "medication", id: m.id }}>{m.medicationName} {m.recordedDose}</RecordLink><span className="small"><StatusPill status={m.status} size="sm" /></span></li>)}</ul> : <p className="muted">None recorded.</p>}
        </Card>
        <Card title="Outstanding actions" icon={<IconFlag size={18} />} headingLevel={3} id="c4" action={pro ? <button className="linkbtn linkbtn--sm" type="button" onClick={() => go("actions")}>All <IconChevronRight size={12} /></button> : undefined}>
          {s.openActions.length ? <ul className="mini">{s.openActions.map((a) => <li key={a.id}><RecordLink to={{ kind: "action", id: a.id }}>{pro ? a.title : a.plainTitle ?? a.title}</RecordLink><span className="small"><StatusPill status={a.status} size="sm" /></span></li>)}</ul> : <p className="muted">None recorded.</p>}
        </Card>
        <Card title="Current care teams" icon={<IconUsers size={18} />} headingLevel={3} id="c5" action={<button className="linkbtn linkbtn--sm" type="button" onClick={() => go("teams")}>All <IconChevronRight size={12} /></button>}>
          <ul className="mini">{s.currentTeams.map((t) => <li key={t.id}><RecordLink to={{ kind: "service", id: t.serviceId }}>{repo.svcName(t.serviceId)}</RecordLink><span className="small muted">{repo.svcOrg(t.serviceId)?.name}</span></li>)}</ul>
        </Card>
      </div>

      {pro && gaps.length > 0 && (
        <>
          <h2 className="section-title section-title--spaced">Information gaps and follow-up</h2>
          <div className="stack">{gaps.slice(0, 3).map((g) => <GapCallout key={g.id} gap={g} />)}</div>
          {gaps.length > 3 && <p><button type="button" className="linkbtn" onClick={() => go("actions")}>Review all {gaps.length} findings <IconChevronRight size={14} /></button></p>}
        </>
      )}
    </>
  );
}
