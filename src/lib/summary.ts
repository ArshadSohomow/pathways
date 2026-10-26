// Derived summaries for the overview. Everything comes from the dataset; nothing is invented.
import type { Repo } from "./repo";
import { DEMO_TODAY, datePart, isFuture, compareDates } from "./dates";
import type { ActionItem, Appointment, HealthcareEvent } from "../types";

export interface NextStep {
  key: string;
  title: string;
  plainTitle: string;
  responsible?: string;
  when?: string; // ISO date
  whenText?: string;
  status: string;
  contact?: string;
  eventId?: string;
  actionId?: string;
  appointmentId?: string;
  confirmed: boolean; // a booked appointment vs a recorded intention
}

export function situation(repo: Repo) {
  const ds = repo.ds;
  const past = ds.events.filter((e) => datePart(e.occurredAt) <= DEMO_TODAY);
  const latestSignificant = [...past].reverse().find((e) => e.significant);
  const latestEvent = past[past.length - 1];
  const ongoing = ds.episodes.filter((e) => e.status === "Ongoing");
  const upcoming = ds.appointments.filter((a) => a.status === "Scheduled" && isFuture(a.scheduledAt)).sort((a, b) => compareDates(a.scheduledAt, b.scheduledAt));
  const activeRefs = ds.referrals.filter((r) => !["Closed", "Assessment completed", "Declined", "Cancelled"].includes(r.currentStatus));
  const currentMeds = ds.medications.filter((m) => m.status === "Active" || m.status === "Awaiting reconciliation");
  const openActions = ds.actions.filter((a) => a.status !== "Completed");
  const currentTeams = ds.teams.filter((t) => t.involvementStatus === "Current");
  return { latestSignificant, latestEvent, ongoing, upcoming, activeRefs, currentMeds, openActions, currentTeams };
}

export function nextSteps(repo: Repo): NextStep[] {
  const ds = repo.ds;
  const out: NextStep[] = [];
  const apptActions = new Set<string>();
  for (const a of ds.appointments.filter((x) => x.status === "Scheduled" && isFuture(x.scheduledAt))) {
    const svc = repo.service(a.serviceId);
    const act = ds.actions.find((x) => a.eventId && x.sourceEventIds.includes(a.eventId));
    if (act) apptActions.add(act.id);
    out.push({
      key: a.id, title: `${a.appointmentType}: ${svc?.name}`, plainTitle: `${svc?.name} appointment`,
      responsible: a.clinicianRole ? `${a.clinicianRole}, ${repo.orgName(a.organisationId)}` : repo.orgName(a.organisationId),
      when: a.scheduledAt, status: "Booked", contact: svc?.contactDetails?.phone ?? repo.organisation(a.organisationId)?.contactDetails.phone,
      eventId: a.eventId, appointmentId: a.id, confirmed: true,
    });
  }
  for (const a of ds.actions.filter((x) => x.status !== "Completed" && !apptActions.has(x.id))) {
    const svc = repo.service(a.responsibleServiceId);
    out.push({
      key: a.id, title: a.title, plainTitle: a.plainTitle ?? a.title, responsible: a.responsibleRoleId,
      when: a.dueAt, whenText: a.dueText, status: a.status, contact: svc?.contactDetails?.phone ?? repo.organisation(svc?.organisationId)?.contactDetails.phone,
      eventId: a.sourceEventIds[a.sourceEventIds.length - 1], actionId: a.id, confirmed: false,
    });
  }
  return out.sort((a, b) => (a.confirmed === b.confirmed ? compareDates(a.when, b.when) : a.confirmed ? -1 : 1));
}

export type { ActionItem, Appointment, HealthcareEvent };
