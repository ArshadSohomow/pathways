// Data access layer. One Repo per patient; every page reads through it.
import type {
  PatientDataset, Organisation, Service, HealthcareEvent, Referral, Appointment, MedicationRecord,
  CareEpisode, Document, ActionItem, RecordSource, JourneyLandmark, TrailBranch, TeamInvolvement,
} from "../types";
import { organisations, services } from "../data/organisations";
import { imogen } from "../data/patient-imogen";
import { walter } from "../data/patient-walter";
import { noor } from "../data/patient-noor";
import { compareDates } from "./dates";

const RAW: PatientDataset[] = [imogen, walter, noor];

const byId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x] as const));

export class Repo {
  readonly ds: PatientDataset;
  private ev: Map<string, HealthcareEvent>;
  private org: Map<string, Organisation>;
  private svc: Map<string, Service>;
  private ref: Map<string, Referral>;
  private med: Map<string, MedicationRecord>;
  private epi: Map<string, CareEpisode>;
  private doc: Map<string, Document>;
  private act: Map<string, ActionItem>;
  private src: Map<string, RecordSource>;
  private lm: Map<string, JourneyLandmark>;
  private appt: Map<string, Appointment>;
  private br: Map<string, TrailBranch>;

  constructor(raw: PatientDataset) {
    const usedOrgIds = new Set<string>();
    const usedSvcIds = new Set<string>();
    const note = (o?: string) => o && usedOrgIds.add(o);
    raw.events.forEach((e) => { note(e.organisationId); usedSvcIds.add(e.serviceId); });
    raw.teams.forEach((t) => usedSvcIds.add(t.serviceId));
    raw.referrals.forEach((r) => { note(r.referringOrganisationId); note(r.receivingOrganisationId); usedSvcIds.add(r.referringServiceId); usedSvcIds.add(r.receivingServiceId); });
    raw.medications.forEach((m) => note(m.organisationId));
    raw.documents.forEach((d) => note(d.organisationId));
    services.filter((s) => usedSvcIds.has(s.id)).forEach((s) => usedOrgIds.add(s.organisationId));
    note(raw.patient.gpOrganisationId);

    this.ds = {
      ...raw,
      organisations: organisations.filter((o) => usedOrgIds.has(o.id)),
      services: services.filter((s) => usedSvcIds.has(s.id)),
      events: [...raw.events].sort((a, b) => compareDates(a.occurredAt, b.occurredAt)),
      landmarks: [...raw.landmarks].sort((a, b) => a.displayOrder - b.displayOrder),
    };
    this.ev = byId(this.ds.events);
    this.org = byId(organisations);
    this.svc = byId(services);
    this.ref = byId(raw.referrals);
    this.med = byId(raw.medications);
    this.epi = byId(raw.episodes);
    this.doc = byId(raw.documents);
    this.act = byId(raw.actions);
    this.src = byId(raw.sources);
    this.lm = byId(raw.landmarks);
    this.appt = byId(raw.appointments);
    this.br = byId(raw.branches);
  }

  get patient() { return this.ds.patient; }
  event(id: string) { return this.ev.get(id); }
  organisation(id?: string) { return id ? this.org.get(id) : undefined; }
  service(id?: string) { return id ? this.svc.get(id) : undefined; }
  referral(id?: string) { return id ? this.ref.get(id) : undefined; }
  medication(id: string) { return this.med.get(id); }
  episode(id?: string) { return id ? this.epi.get(id) : undefined; }
  document(id: string) { return this.doc.get(id); }
  action(id: string) { return this.act.get(id); }
  source(id?: string) { return id ? this.src.get(id) : undefined; }
  landmark(id: string) { return this.lm.get(id); }
  appointment(id: string) { return this.appt.get(id); }
  branch(id: string) { return this.br.get(id); }

  orgName(id?: string) { return this.organisation(id)?.name ?? "Unknown organisation"; }
  svcName(id?: string) { return this.service(id)?.name ?? "Unknown service"; }
  svcOrg(id?: string) { const s = this.service(id); return s ? this.organisation(s.organisationId) : undefined; }
  svcLabel(id?: string) { const s = this.service(id); if (!s) return "Unknown service"; return `${s.name} · ${this.orgName(s.organisationId)}`; }

  events(ids: string[]) { return ids.map((i) => this.ev.get(i)).filter(Boolean) as HealthcareEvent[]; }
  documentsForEvent(eventId: string) { return this.ds.documents.filter((d) => d.eventId === eventId); }
  medsForEvent(eventId: string) { return this.ds.medications.filter((m) => m.linkedEventIds.includes(eventId)); }
  appointmentForEvent(eventId: string) { return this.ds.appointments.find((a) => a.eventId === eventId); }
  actionsForEvent(eventId: string) { return this.ds.actions.filter((a) => a.sourceEventIds.includes(eventId)); }
  episodesForEvent(eventId: string) { return this.ds.episodes.filter((e) => e.relatedEventIds.includes(eventId)); }
  /** Events that link to this one, plus the ones it links to (bidirectional). */
  relatedEvents(eventId: string) {
    const e = this.ev.get(eventId);
    const ids = new Set<string>(e?.linkedEventIds ?? []);
    this.ds.events.forEach((x) => { if (x.linkedEventIds.includes(eventId)) ids.add(x.id); });
    ids.delete(eventId);
    return this.events([...ids]).sort((a, b) => compareDates(a.occurredAt, b.occurredAt));
  }
  /** The landmark that represents this event, preferring the most specific (fewest linked events). */
  landmarkForEvent(eventId: string): JourneyLandmark | undefined {
    const hits = this.ds.landmarks.filter((l) => l.linkedEventIds.includes(eventId));
    return hits.sort((a, b) => a.linkedEventIds.length - b.linkedEventIds.length)[0];
  }
  landmarkForReferral(refId: string) { return this.ds.landmarks.find((l) => l.linkedReferralId === refId && l.landmarkType === "signpost") ?? this.ds.landmarks.find((l) => l.linkedReferralId === refId); }
  landmarkForEpisode(epId: string) { return this.ds.landmarks.find((l) => l.linkedCareEpisodeId === epId); }
  teamForService(svcId: string): TeamInvolvement | undefined { return this.ds.teams.find((t) => t.serviceId === svcId); }
  referralsForService(svcId: string) { return this.ds.referrals.filter((r) => r.receivingServiceId === svcId || r.referringServiceId === svcId); }
  eventsForService(svcId: string) { return this.ds.events.filter((e) => e.serviceId === svcId); }
  medGroup(group: string) { return this.ds.medications.filter((m) => m.medicationGroup === group).sort((a, b) => compareDates(a.startDate, b.startDate)); }
}

const cache = new Map<string, Repo>();
export const PATIENT_IDS = RAW.map((r) => r.patient.id);
export const PATIENTS = RAW.map((r) => r.patient);
export function getRepo(patientId: string): Repo {
  let r = cache.get(patientId);
  if (!r) {
    const raw = RAW.find((p) => p.patient.id === patientId) ?? RAW[0];
    r = new Repo(raw);
    cache.set(raw.patient.id, r);
  }
  return r;
}
export const ALL_RAW = RAW;
