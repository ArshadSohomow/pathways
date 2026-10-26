// Information-gap rules. Transparent and deterministic: each finding names the rule that produced
// it, the records involved and what is missing. No risk scores. A finding means the RECORD is
// incomplete or inconsistent — it never proves that care was or was not delivered.
import type { Repo } from "./repo";
import { DEMO_TODAY, daysBetween, fmtDate, isPast, datePart } from "./dates";

export type GapCategory = "Information incomplete" | "Review recommended" | "Potential coordination issue";
export type RefKind = "event" | "referral" | "medication" | "document" | "action" | "source" | "appointment" | "episode";
export interface RecordRef { kind: RefKind; id: string; label: string }

export interface GapFinding {
  id: string;
  ruleId: string;
  category: GapCategory;
  title: string;
  plainTitle: string;
  whatFound: string;
  plainExplanation: string;
  whyMatters: string;
  missing: string;
  reviewer?: string;
  nextAction: string;
  refs: RecordRef[];
  landmarkIds: string[];
  date?: string;
}

export interface GapRule { id: string; name: string; logic: string; category: GapCategory }

/** Demonstration threshold: a referral sent but not recorded as received after this many days. */
export const RECEIPT_THRESHOLD_DAYS = 14;

export const RULES: GapRule[] = [
  { id: "R1", name: "Referral without a recorded decision", category: "Information incomplete", logic: "Referral has a received date, but no decision date and its status is Received or Awaiting review." },
  { id: "R2", name: "Referral not recorded as received", category: "Potential coordination issue", logic: `Referral was sent more than ${RECEIPT_THRESHOLD_DAYS} days before the demonstration date and has no received date. (${RECEIPT_THRESHOLD_DAYS} days is a demonstration rule, not a clinical standard.)` },
  { id: "R3", name: "Past appointment without a documented outcome", category: "Information incomplete", logic: "Appointment date is before the demonstration date and status is 'Outcome not recorded' or still 'Scheduled'." },
  { id: "R4", name: "Discharge without a recorded follow-up", category: "Potential coordination issue", logic: "Discharge event states a follow-up was expected, and no later completed contact is recorded from the service it referred to (or, if no referral is named, from another service linking back to the discharge)." },
  { id: "R5", name: "Medication records conflict", category: "Review recommended", logic: "Two or more records for the same medicine are Active or Awaiting reconciliation with different recorded doses." },
  { id: "R6", name: "Action past its documented date with no completion", category: "Review recommended", logic: "Action has a documented due date before the demonstration date and status 'No completion recorded'." },
  { id: "R7", name: "Referenced document not received", category: "Information incomplete", logic: "A document is referenced by a record but its availability status is 'Referenced, not received'." },
  { id: "R8", name: "Unverified record source", category: "Information incomplete", logic: "A record source has verification status 'Unverified'." },
  { id: "R9", name: "Conflicting dates", category: "Review recommended", logic: "A document states an event date that differs from the date of the event it is linked to." },
  { id: "R10", name: "Next action without a responsible role", category: "Potential coordination issue", logic: "An open action has no responsible role or service recorded." },
  { id: "R11", name: "Care period with a missing date", category: "Information incomplete", logic: "A care episode has no start date, or is marked Completed without an end date." },
  { id: "R12", name: "Cancelled appointment not rebooked", category: "Potential coordination issue", logic: "An appointment was cancelled, the referral is still open, and no later appointment with the same service is recorded." },
];

export function detectGaps(repo: Repo): GapFinding[] {
  const ds = repo.ds;
  const out: GapFinding[] = [];
  const push = (f: Omit<GapFinding, "landmarkIds">) => out.push({ ...f, landmarkIds: landmarksFor(repo, f.refs) });

  // R1 / R2 referrals
  for (const r of ds.referrals) {
    const to = repo.svcLabel(r.receivingServiceId);
    if (r.receivedAt && !r.decisionAt && (r.currentStatus === "Received" || r.currentStatus === "Awaiting review")) {
      const waited = daysBetween(r.receivedAt, DEMO_TODAY);
      push({
        id: `gap-R1-${r.id}`, ruleId: "R1", category: "Information incomplete",
        title: "Referral outcome not recorded",
        plainTitle: `Your referral to ${repo.svcName(r.receivingServiceId)} has not been reviewed yet`,
        whatFound: `The referral to ${to} was received on ${fmtDate(r.receivedAt)}. The available records do not contain a triage decision or an assessment appointment.`,
        plainExplanation: `The team received your referral on ${fmtDate(r.receivedAt)}. They have not yet recorded a decision or offered an appointment. This is ${waited} days after it was received.`,
        whyMatters: "Without a recorded decision it is not possible to tell from the record whether the referral has been accepted, redirected or is still waiting.",
        missing: "Triage decision, decision date and any appointment details.",
        reviewer: repo.svcName(r.receivingServiceId) + " (receiving service)",
        nextAction: "Receiving service to confirm triage status. Referrer may wish to check receipt if no decision follows.",
        refs: [{ kind: "referral", id: r.id, label: `Referral ${refLabel(r.id)}` }, ...r.linkedEventIds.map((id) => evRef(repo, id))],
        date: r.receivedAt,
      });
    }
    if (r.sentAt && !r.receivedAt && daysBetween(r.sentAt, DEMO_TODAY) > RECEIPT_THRESHOLD_DAYS) {
      push({
        id: `gap-R2-${r.id}`, ruleId: "R2", category: "Potential coordination issue",
        title: "Transfer without a receiving-service record",
        plainTitle: `No record that ${repo.svcName(r.receivingServiceId)} received your referral`,
        whatFound: `A referral was sent from ${repo.svcLabel(r.referringServiceId)} to ${to} on ${fmtDate(r.sentAt)}. The receiving service's record contains no receipt, decision or contact (${daysBetween(r.sentAt, DEMO_TODAY)} days).`,
        plainExplanation: `A referral was sent on ${fmtDate(r.sentAt)}, but the team it was sent to has no record of receiving it. This does not mean nobody has acted — only that the records we hold do not show it.`,
        whyMatters: "The handover may not have completed. The patient may not have received the follow-up the referrer intended.",
        missing: "Receipt date, acceptance decision and first contact.",
        reviewer: `${repo.svcName(r.referringServiceId)} (referrer) and ${repo.svcName(r.receivingServiceId)}`,
        nextAction: "Confirm with the receiving service whether the referral was received; re-send if not.",
        refs: [{ kind: "referral", id: r.id, label: `Referral ${refLabel(r.id)}` }, ...r.linkedEventIds.map((id) => evRef(repo, id))],
        date: r.sentAt,
      });
    }
  }

  // R3 past appointments without outcome
  for (const a of ds.appointments) {
    if (isPast(a.scheduledAt) && (a.status === "Outcome not recorded" || a.status === "Scheduled")) {
      push({
        id: `gap-R3-${a.id}`, ruleId: "R3", category: "Information incomplete",
        title: "Past appointment without a documented outcome",
        plainTitle: `No outcome recorded for your ${repo.svcName(a.serviceId)} appointment on ${fmtDate(a.scheduledAt)}`,
        whatFound: `${a.appointmentType} with ${repo.svcLabel(a.serviceId)} on ${fmtDate(a.scheduledAt)}. No attendance status, outcome or clinic letter is recorded.`,
        plainExplanation: `You had an appointment booked on ${fmtDate(a.scheduledAt)}. The records do not show what happened at it. If you attended, the clinic may not have sent its notes yet.`,
        whyMatters: "Decisions made at this appointment (medication, tests, next review) cannot be confirmed from the record.",
        missing: "Attendance status, outcome and clinic letter.",
        reviewer: repo.svcName(a.serviceId),
        nextAction: "Clinic to record attendance and outcome and send the clinic letter.",
        refs: [{ kind: "appointment", id: a.id, label: `${a.appointmentType}, ${fmtDate(a.scheduledAt)}` }, ...(a.eventId ? [evRef(repo, a.eventId)] : [])],
        date: a.scheduledAt,
      });
    }
  }

  // R4 discharge without follow-up
  for (const e of ds.events) {
    if (e.eventType !== "Discharge" || !e.metadata?.followUpExpected) continue;
    // If the discharge names referrals, the follow-up must come from a receiving service of those referrals.
    const expectedSvcs = e.relatedReferralIds.map((r) => repo.referral(r)?.receivingServiceId).filter(Boolean) as string[];
    const followUps = ds.events.filter((x) =>
      x.occurredAt > e.occurredAt && x.status === "Completed" && x.eventType !== "Referral" &&
      (expectedSvcs.length ? expectedSvcs.includes(x.serviceId) : x.linkedEventIds.includes(e.id) && x.serviceId !== e.serviceId));
    if (followUps.length === 0) {
      push({
        id: `gap-R4-${e.id}`, ruleId: "R4", category: "Potential coordination issue",
        title: "Discharge without a recorded follow-up",
        plainTitle: "No follow-up recorded after you left hospital",
        whatFound: `Discharge from ${repo.svcLabel(e.serviceId)} on ${fmtDate(e.occurredAt)} states that follow-up was expected. No follow-up contact from another service links to this discharge.`,
        plainExplanation: `When you left hospital on ${fmtDate(e.occurredAt)}, follow-up care was planned. The records do not yet show that follow-up taking place.`,
        whyMatters: "Continuity after discharge is a common point where care plans can be lost between services.",
        missing: "A recorded follow-up contact from the receiving service.",
        reviewer: repo.svcName(e.serviceId) + " and the receiving service",
        nextAction: "Confirm follow-up arrangements with the receiving service.",
        refs: [evRef(repo, e.id), ...e.relatedReferralIds.map((r) => ({ kind: "referral" as const, id: r, label: `Referral ${refLabel(r)}` }))],
        date: e.occurredAt,
      });
    }
  }

  // R5 medication conflicts
  const groups = new Map<string, typeof ds.medications>();
  ds.medications.forEach((m) => groups.set(m.medicationGroup, [...(groups.get(m.medicationGroup) ?? []), m]));
  for (const [g, recs] of groups) {
    const live = recs.filter((m) => m.status === "Active" || m.status === "Awaiting reconciliation");
    const doses = new Set(live.map((m) => m.recordedDose));
    if (live.length > 1 && doses.size > 1) {
      const name = live[0].medicationName;
      push({
        id: `gap-R5-${g}`, ruleId: "R5", category: "Review recommended",
        title: `Medication discrepancy: ${name}`,
        plainTitle: `Your records show two different doses of ${name}`,
        whatFound: live.map((m) => `${repo.orgName(m.organisationId)} (${m.recordType.toLowerCase()}, updated ${fmtDate(m.lastUpdatedAt)}): ${m.recordedDose} ${m.frequency.toLowerCase()}`).join(". ") + ".",
        plainExplanation: `Different services have recorded different doses of ${name}. Please don't change how you take any medicine based on this page — ask your GP practice or pharmacist which dose is correct.`,
        whyMatters: "The record cannot show which dose is currently being taken. Prescriptions issued from one record may not match the other.",
        missing: "A reconciled medication record confirming the intended dose.",
        reviewer: "Prescriber or practice pharmacist (no responsible role recorded)",
        nextAction: "Reconcile the dose against the latest specialist plan and update the repeat prescription.",
        refs: live.map((m): RecordRef => ({ kind: "medication", id: m.id, label: `${m.medicationName} ${m.recordedDose} (${repo.orgName(m.organisationId)})` })).concat(live.flatMap((m) => m.linkedEventIds.slice(-1).map((id) => evRef(repo, id)))),
        date: live.map((m) => m.lastUpdatedAt).sort().pop(),
      });
    }
  }

  // R6 overdue actions
  for (const a of ds.actions) {
    if (a.status === "No completion recorded" && a.dueAt && isPast(a.dueAt)) {
      push({
        id: `gap-R6-${a.id}`, ruleId: "R6", category: "Review recommended",
        title: `Action not recorded as completed: ${a.title}`,
        plainTitle: `No record yet of: ${a.plainTitle ?? a.title}`,
        whatFound: `${a.description} The documented date was ${fmtDate(a.dueAt)}. No completion is recorded.`,
        plainExplanation: `${a.plainTitle ?? a.title} was due by ${fmtDate(a.dueAt)}. The records do not show it happening. It may have been done and not yet recorded.`,
        whyMatters: "Missing completion may mean a monitoring step was not done, or was done and not recorded.",
        missing: "A completion event (e.g. test result) linked to this action.",
        reviewer: a.responsibleRoleId,
        nextAction: "Responsible service to confirm whether the action took place and record the result.",
        refs: [{ kind: "action", id: a.id, label: a.title }, ...a.sourceEventIds.map((id) => evRef(repo, id))],
        date: a.dueAt,
      });
    }
  }
  // R6b: action without a due date, no completion recorded (urgent wording) — treated as coordination issue via R2 already.

  // R7 missing documents
  for (const d of ds.documents) {
    if (d.availabilityStatus === "Referenced, not received") {
      push({
        id: `gap-R7-${d.id}`, ruleId: "R7", category: "Information incomplete",
        title: `Document not received: ${d.title}`,
        plainTitle: `A letter is missing: ${d.title}`,
        whatFound: `${d.title} from ${repo.orgName(d.organisationId)} is referenced${d.eventId ? ` by "${repo.event(d.eventId)?.title}"` : ""} but has not been received.`,
        plainExplanation: "A letter about your care is mentioned in your record but we don't have a copy. You can ask the service that wrote it for a copy.",
        whyMatters: "The details it contains (plans, outcomes, advice) are not available to other services.",
        missing: "The document itself.",
        reviewer: repo.orgName(d.organisationId),
        nextAction: "Request a copy from the authoring organisation.",
        refs: [{ kind: "document", id: d.id, label: d.title }, ...(d.eventId ? [evRef(repo, d.eventId)] : [])],
        date: d.documentDate,
      });
    }
  }

  // R8 unverified sources
  for (const s of ds.sources) {
    if (s.verificationStatus === "Unverified") {
      const evs = ds.events.filter((e) => e.sourceRecordId === s.id);
      push({
        id: `gap-R8-${s.id}`, ruleId: "R8", category: "Information incomplete",
        title: "Record from an unverified source",
        plainTitle: `A record from ${repo.orgName(s.organisationId)} has not been checked`,
        whatFound: `${s.sourceType} from ${repo.orgName(s.organisationId)} (${s.jurisdiction}), received ${fmtDate(s.receivedAt)}. ${s.note ?? ""}`.trim(),
        plainExplanation: "This record came from outside the UK services and has not been confirmed with the provider. It is shown as you supplied it.",
        whyMatters: "Clinical details, dates and medicines in this record cannot be relied upon without confirmation.",
        missing: "Verification with the source organisation or a certified translation.",
        reviewer: "GP practice (holder of the imported record)",
        nextAction: "Verify with the provider or note the limitation when relying on this record.",
        refs: [{ kind: "source", id: s.id, label: `${s.sourceType} (${s.sourceReference})` }, ...evs.map((e) => evRef(repo, e.id))],
        date: s.receivedAt,
      });
    }
  }

  // R9 conflicting dates
  for (const d of ds.documents) {
    if (!d.statedEventDate || !d.eventId) continue;
    const e = repo.event(d.eventId);
    if (e && datePart(e.occurredAt) !== d.statedEventDate) {
      push({
        id: `gap-R9-${d.id}`, ruleId: "R9", category: "Review recommended",
        title: "Conflicting dates",
        plainTitle: "Two records give different dates for the same visit",
        whatFound: `The event "${e.title}" is recorded on ${fmtDate(e.occurredAt)}, but the linked document "${d.title}" states ${fmtDate(d.statedEventDate)}.`,
        plainExplanation: `One record says ${fmtDate(e.occurredAt)} and another says ${fmtDate(d.statedEventDate)}. The journey uses ${fmtDate(e.occurredAt)} until this is checked.`,
        whyMatters: "Chronology and medication timings depend on the correct date.",
        missing: "Confirmation of the correct date.",
        reviewer: "Record holder: " + repo.orgName(repo.source(d.sourceRecordId)?.organisationId === d.organisationId ? d.organisationId : repo.patient.gpOrganisationId),
        nextAction: "Check the original document and correct whichever date is wrong.",
        refs: [evRef(repo, e.id), { kind: "document", id: d.id, label: d.title }],
        date: e.occurredAt,
      });
    }
  }

  // R10 open action without responsible role
  for (const a of ds.actions) {
    if (a.status === "Open" && !a.responsibleRoleId && !a.responsibleServiceId) {
      push({
        id: `gap-R10-${a.id}`, ruleId: "R10", category: "Potential coordination issue",
        title: `No responsible role recorded: ${a.title}`,
        plainTitle: `It isn't recorded who will: ${(a.plainTitle ?? a.title).toLowerCase()}`,
        whatFound: `${a.description}`,
        plainExplanation: "This next step is recorded, but the records don't say which team or person is responsible for it.",
        whyMatters: "Actions without a named owner are at risk of not being picked up.",
        missing: "Responsible role or service.",
        nextAction: "Agree and record who is responsible.",
        refs: [{ kind: "action", id: a.id, label: a.title }, ...a.sourceEventIds.map((id) => evRef(repo, id))],
        date: a.updatedAt,
      });
    }
  }

  // R11 episode missing dates
  for (const ep of ds.episodes) {
    if (!ep.startDate || (ep.status === "Completed" && !ep.endDate)) {
      push({
        id: `gap-R11-${ep.id}`, ruleId: "R11", category: "Information incomplete",
        title: `Care period missing a date: ${ep.title}`,
        plainTitle: `We can't tell how long "${ep.plainTitle ?? ep.title}" has lasted`,
        whatFound: `${ep.title}: ${!ep.startDate ? "start date not recorded" : "end date not recorded"}. ${repo.source(repo.event(ep.relatedEventIds[0] ?? "")?.sourceRecordId)?.note ?? ""}`.trim(),
        plainExplanation: "The date this care started isn't in the records we hold (for example, because notes were transferred from another practice). We show the dates we know and don't guess the rest.",
        whyMatters: "The total duration of involvement cannot be calculated.",
        missing: !ep.startDate ? "Start date." : "End date.",
        reviewer: "GP practice",
        nextAction: "Add the start date from the previous record if available.",
        refs: [{ kind: "episode", id: ep.id, label: ep.title }],
      });
    }
  }

  // R12 cancelled not rebooked
  for (const a of ds.appointments) {
    if (a.status !== "Cancelled" || !a.linkedReferralId) continue;
    const ref = repo.referral(a.linkedReferralId);
    const open = ref && !["Closed", "Assessment completed", "Declined", "Cancelled"].includes(ref.currentStatus);
    const later = ds.appointments.some((b) => b.serviceId === a.serviceId && b.scheduledAt > a.scheduledAt && b.status !== "Cancelled");
    if (open && !later) {
      push({
        id: `gap-R12-${a.id}`, ruleId: "R12", category: "Potential coordination issue",
        title: "Cancelled appointment not rebooked",
        plainTitle: `Your ${repo.svcName(a.serviceId)} appointment was cancelled and no new one is recorded`,
        whatFound: `${a.appointmentType} on ${fmtDate(a.scheduledAt)} was cancelled (${a.outcome ?? "no reason recorded"}). The referral remains open and no later appointment is recorded.`,
        plainExplanation: `Your appointment on ${fmtDate(a.scheduledAt)} was cancelled. The records don't show a new date yet.`,
        whyMatters: "The original reason for referral may remain unaddressed.",
        missing: "A rebooked appointment or a decision to close the referral.",
        reviewer: repo.svcName(a.serviceId),
        nextAction: "Service to offer a new appointment or record why the referral was closed.",
        refs: [{ kind: "appointment", id: a.id, label: `${a.appointmentType}, ${fmtDate(a.scheduledAt)}` }, { kind: "referral", id: ref!.id, label: `Referral ${refLabel(ref!.id)}` }, ...(a.eventId ? [evRef(repo, a.eventId)] : [])],
        date: a.scheduledAt,
      });
    }
  }

  const order: Record<GapCategory, number> = { "Potential coordination issue": 0, "Review recommended": 1, "Information incomplete": 2 };
  return out.sort((a, b) => order[a.category] - order[b.category] || (b.date ?? "").localeCompare(a.date ?? ""));
}

export function refLabel(refId: string): string {
  // Stable demo identifier derived from the referral id
  let h = 0;
  for (const c of refId) h = (h * 31 + c.charCodeAt(0)) % 100000;
  return `PW-REF-${String(h).padStart(5, "0")}`;
}

function evRef(repo: Repo, id: string): RecordRef {
  const e = repo.event(id);
  return { kind: "event", id, label: e ? `${e.title} (${fmtDate(e.occurredAt)})` : id };
}

function landmarksFor(repo: Repo, refs: RecordRef[]): string[] {
  const ids = new Set<string>();
  for (const r of refs) {
    if (r.kind === "event") { const l = repo.landmarkForEvent(r.id); if (l) ids.add(l.id); }
    if (r.kind === "referral") { const l = repo.landmarkForReferral(r.id); if (l) ids.add(l.id); }
    if (r.kind === "episode") { const l = repo.landmarkForEpisode(r.id); if (l) ids.add(l.id); }
    if (r.kind === "appointment") { const a = repo.appointment(r.id); const l = a?.eventId ? repo.landmarkForEvent(a.eventId) : undefined; if (l) ids.add(l.id); }
    if (r.kind === "medication") { /* medications link via events */ }
  }
  return [...ids];
}
