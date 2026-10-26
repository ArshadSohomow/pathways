// Timeline filtering and global search. Filters combine with AND; values within a filter with OR.
import type { HealthcareEvent, EventType, EventStatus } from "../types";
import type { Repo } from "./repo";
import { datePart, fmtDate } from "./dates";
import { refLabel } from "./gaps";

export interface TimelineFilters {
  q: string;
  from?: string;
  to?: string;
  types: EventType[];
  organisationIds: string[];
  serviceIds: string[];
  statuses: EventStatus[];
  significantOnly: boolean;
  sort: "asc" | "desc";
}
export const EMPTY_TIMELINE_FILTERS: TimelineFilters = { q: "", types: [], organisationIds: [], serviceIds: [], statuses: [], significantOnly: false, sort: "desc" };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function eventHaystack(repo: Repo, e: HealthcareEvent): string {
  return norm([e.title, e.summary, e.plainSummary, e.eventType, e.outcome, repo.orgName(e.organisationId), repo.svcName(e.serviceId),
    ...e.relatedReferralIds.map(refLabel), e.metadata?.clinician, e.metadata?.location].filter(Boolean).join(" "));
}

export function filterEvents(repo: Repo, f: TimelineFilters): HealthcareEvent[] {
  const q = norm(f.q.trim());
  const terms = q ? q.split(/\s+/) : [];
  const out = repo.ds.events.filter((e) => {
    const d = datePart(e.occurredAt);
    if (f.from && d < f.from) return false;
    if (f.to && d > f.to) return false;
    if (f.types.length && !f.types.includes(e.eventType)) return false;
    if (f.organisationIds.length && !f.organisationIds.includes(e.organisationId)) return false;
    if (f.serviceIds.length && !f.serviceIds.includes(e.serviceId)) return false;
    if (f.statuses.length && !f.statuses.includes(e.status)) return false;
    if (f.significantOnly && !e.significant) return false;
    if (terms.length) { const h = eventHaystack(repo, e); if (!terms.every((t) => h.includes(t))) return false; }
    return true;
  });
  return f.sort === "asc" ? out : [...out].reverse();
}

export function countActiveTimelineFilters(f: TimelineFilters): number {
  return (f.q ? 1 : 0) + (f.from ? 1 : 0) + (f.to ? 1 : 0) + (f.types.length ? 1 : 0) + (f.organisationIds.length ? 1 : 0) + (f.serviceIds.length ? 1 : 0) + (f.statuses.length ? 1 : 0) + (f.significantOnly ? 1 : 0);
}

// ---------- global search ----------
export type SearchKind = "event" | "referral" | "medication" | "document" | "organisation" | "service";
export interface SearchResult { kind: SearchKind; id: string; title: string; date?: string; typeLabel: string; provider: string; snippet?: string }

export function globalSearch(repo: Repo, query: string): SearchResult[] {
  const q = norm(query.trim());
  if (q.length < 2) return [];
  const terms = q.split(/\s+/);
  const match = (s: string) => { const h = norm(s); return terms.every((t) => h.includes(t)); };
  const res: SearchResult[] = [];
  for (const e of repo.ds.events) {
    if (match(eventHaystack(repo, e))) res.push({ kind: "event", id: e.id, title: e.title, date: e.occurredAt, typeLabel: e.eventType, provider: repo.orgName(e.organisationId), snippet: e.summary });
  }
  for (const r of repo.ds.referrals) {
    const hay = [refLabel(r.id), r.reason, r.currentStatus, repo.svcLabel(r.receivingServiceId), repo.svcLabel(r.referringServiceId), "referral"].join(" ");
    if (match(hay)) res.push({ kind: "referral", id: r.id, title: `Referral to ${repo.svcName(r.receivingServiceId)} (${refLabel(r.id)})`, date: r.sentAt ?? r.createdAt, typeLabel: "Referral", provider: repo.orgName(r.receivingOrganisationId), snippet: `Status: ${r.currentStatus}` });
  }
  for (const m of repo.ds.medications) {
    const hay = [m.medicationName, m.recordedDose, m.status, m.recordType, repo.orgName(m.organisationId), "medication medicine"].join(" ");
    if (match(hay)) res.push({ kind: "medication", id: m.id, title: `${m.medicationName} ${m.recordedDose}`, date: m.startDate, typeLabel: `Medication · ${m.status}`, provider: repo.orgName(m.organisationId) });
  }
  for (const d of repo.ds.documents) {
    const hay = [d.title, d.documentType, repo.orgName(d.organisationId), d.syntheticContent ?? ""].join(" ");
    if (match(hay)) res.push({ kind: "document", id: d.id, title: d.title, date: d.documentDate, typeLabel: `Document · ${d.documentType}`, provider: repo.orgName(d.organisationId), snippet: d.availabilityStatus });
  }
  for (const o of repo.ds.organisations) {
    if (match([o.name, o.organisationType, o.location, o.jurisdiction].join(" "))) res.push({ kind: "organisation", id: o.id, title: o.name, typeLabel: o.organisationType, provider: `${o.location} · ${o.jurisdiction}` });
  }
  for (const s of repo.ds.services) {
    if (match([s.name, s.serviceType, s.description].join(" "))) res.push({ kind: "service", id: s.id, title: s.name, typeLabel: s.serviceType, provider: repo.orgName(s.organisationId) });
  }
  return res.slice(0, 40);
}

export const describeDate = (d?: string) => (d ? fmtDate(d) : "Date not recorded");
