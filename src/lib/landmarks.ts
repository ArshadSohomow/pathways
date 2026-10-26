// Journey landmark view-model. Landmarks are a presentation layer: titles and order are
// presentation, but dates, durations and statuses are always derived from the linked records.
import type { JourneyLandmark, HealthcareEvent, Referral, CareEpisode, LandmarkType } from "../types";
import type { Repo } from "./repo";
import type { GapFinding } from "./gaps";
import { calcDuration, DurationResult, isFuture, datePart, DEMO_TODAY, daysBetween } from "./dates";

export type LandmarkStatus = "completed" | "ongoing" | "upcoming" | "awaiting" | "not-recorded" | "cancelled";

export const STATUS_META: Record<LandmarkStatus, { label: string; patientLabel: string; description: string }> = {
  completed: { label: "Completed", patientLabel: "Completed", description: "Recorded as finished." },
  ongoing: { label: "Ongoing", patientLabel: "Ongoing", description: "Recorded as still open; no end date." },
  upcoming: { label: "Upcoming", patientLabel: "Booked", description: "Scheduled for a future date." },
  awaiting: { label: "Awaiting update", patientLabel: "Waiting for an update", description: "Started but the next step is not yet recorded." },
  "not-recorded": { label: "Outcome not recorded", patientLabel: "Outcome not recorded", description: "Took place or was due, but no outcome is recorded." },
  cancelled: { label: "Cancelled", patientLabel: "Cancelled", description: "Recorded as cancelled." },
};

export const TYPE_META: Record<LandmarkType, { label: string; meaning: string; plainMeaning: string }> = {
  signpost: { label: "Signpost", meaning: "Referral or change of direction", plainMeaning: "A referral — you were sent to another service" },
  campsite: { label: "Campsite", meaning: "A period of care with a team or service", plainMeaning: "A period of care with one team" },
  bridge: { label: "Bridge", meaning: "Handover between services or settings", plainMeaning: "Your care was handed from one service to another" },
  viewpoint: { label: "Viewpoint", meaning: "Milestone, assessment or review", plainMeaning: "An important milestone or review" },
  marker: { label: "Trail marker", meaning: "Single event (appointment, test, medicine change)", plainMeaning: "A single visit, test or change" },
  trailhead: { label: "Trailhead", meaning: "Start of the recorded journey", plainMeaning: "Where your records begin" },
};

export interface LandmarkVM {
  lm: JourneyLandmark;
  events: HealthcareEvent[];
  referral?: Referral;
  episode?: CareEpisode;
  start?: string;
  end?: string;
  status: LandmarkStatus;
  statusLabel: string; // specific wording from the record (e.g. referral status)
  duration?: DurationResult;
  waitDays?: number; // referral: days from received to decision
  gaps: GapFinding[];
  serviceIds: string[];
  organisationIds: string[];
  significant: boolean;
  isOverseas: boolean;
  isPrivate: boolean;
  isCurrent?: boolean;
  primaryEventId?: string;
}

const REF_STATUS: Record<Referral["currentStatus"], LandmarkStatus> = {
  Sent: "awaiting", Received: "awaiting", "Awaiting review": "awaiting",
  Accepted: "ongoing", "Appointment scheduled": "ongoing",
  "Assessment completed": "completed", Closed: "completed", Declined: "completed", Redirected: "completed", Cancelled: "cancelled",
};

export function buildLandmarks(repo: Repo, gaps: GapFinding[]): LandmarkVM[] {
  const vms = repo.ds.landmarks.map((lm) => buildOne(repo, lm, gaps));
  // Current recorded stage: the latest landmark that has started on or before the demo date.
  const started = vms.filter((v) => v.start && datePart(v.start) <= DEMO_TODAY);
  const current = started.sort((a, b) => (a.start! < b.start! ? -1 : 1)).pop();
  if (current) current.isCurrent = true;
  return vms;
}

function buildOne(repo: Repo, lm: JourneyLandmark, allGaps: GapFinding[]): LandmarkVM {
  const events = repo.events(lm.linkedEventIds);
  const referral = repo.referral(lm.linkedReferralId);
  const episode = repo.episode(lm.linkedCareEpisodeId);
  const serviceIds = new Set<string>(events.map((e) => e.serviceId));
  episode?.participatingServiceIds.forEach((s) => serviceIds.add(s));
  if (referral) { serviceIds.add(referral.referringServiceId); serviceIds.add(referral.receivingServiceId); }
  const organisationIds = new Set<string>([...serviceIds].map((s) => repo.service(s)?.organisationId).filter(Boolean) as string[]);

  let start: string | undefined;
  let end: string | undefined;
  let status: LandmarkStatus = "completed";
  let statusLabel = "Completed";
  let duration: DurationResult | undefined;
  let waitDays: number | undefined;

  const evStart = events.map((e) => e.occurredAt).sort()[0];
  const evEnd = events.map((e) => e.endedAt ?? e.occurredAt).sort().pop();

  if (episode && lm.landmarkType === "campsite") {
    start = episode.startDate;
    end = episode.endDate;
    const map: Record<CareEpisode["status"], LandmarkStatus> = { Completed: "completed", Ongoing: "ongoing", Planned: "upcoming", "Outcome not recorded": "not-recorded" };
    status = map[episode.status];
    statusLabel = episode.status;
    duration = calcDuration(episode.startDate, episode.endDate, episode.status === "Ongoing");
  } else if (referral && lm.landmarkType === "signpost") {
    start = referral.sentAt ?? referral.createdAt;
    end = referral.decisionAt;
    status = REF_STATUS[referral.currentStatus];
    statusLabel = referral.currentStatus;
    if (referral.receivedAt && referral.decisionAt) {
      waitDays = daysBetween(referral.receivedAt, referral.decisionAt);
    }
  } else if (lm.landmarkType === "bridge") {
    start = evStart;
    end = evEnd;
    if (referral) {
      if (referral.receivedAt) { status = "completed"; statusLabel = "Handover received"; }
      else { status = "awaiting"; statusLabel = "Receipt not recorded"; }
    } else { status = "completed"; statusLabel = "Handover recorded"; }
  } else {
    start = evStart;
    // Single-point landmarks: only show an end time if the primary event itself recorded one.
    end = (events.find((e) => e.significant) ?? events[0])?.endedAt;
    const st = events.map((e) => e.status);
    if (st.includes("Scheduled") && events.some((e) => isFuture(e.occurredAt))) { status = "upcoming"; statusLabel = "Booked"; }
    else if (st.includes("Outcome not recorded")) { status = "not-recorded"; statusLabel = "Outcome not recorded"; }
    else if (st.includes("Awaiting update")) { status = "awaiting"; statusLabel = "Awaiting update"; }
    else if (st.includes("Cancelled")) { status = "cancelled"; statusLabel = "Cancelled"; }
  }

  const ids = new Set([lm.id]);
  const gaps = allGaps.filter((g) => g.landmarkIds.some((i) => ids.has(i)));
  const orgs = [...organisationIds].map((o) => repo.organisation(o));
  const primary = events.find((e) => e.significant) ?? events[0];

  return {
    lm, events, referral, episode, start, end, status, statusLabel, duration, waitDays, gaps,
    serviceIds: [...serviceIds], organisationIds: [...organisationIds],
    significant: lm.landmarkType !== "marker" || events.some((e) => e.significant),
    isOverseas: lm.visualVariant === "overseas" || orgs.some((o) => o?.sector === "Overseas"),
    isPrivate: lm.visualVariant === "private" || orgs.some((o) => o?.sector === "Private"),
    primaryEventId: primary?.id,
  };
}

// ---------- filtering ----------
export interface LandscapeFilters {
  branchId: string | "all";
  serviceId: string | "all";
  organisationId: string | "all";
  from?: string;
  to?: string;
  milestonesOnly: boolean;
  ongoingOnly: boolean;
  gapsOnly: boolean;
}
export const EMPTY_LANDSCAPE_FILTERS: LandscapeFilters = { branchId: "all", serviceId: "all", organisationId: "all", milestonesOnly: false, ongoingOnly: false, gapsOnly: false };

export function landmarkMatches(v: LandmarkVM, f: LandscapeFilters): boolean {
  if (f.branchId !== "all" && v.lm.trailBranchId !== f.branchId) return false;
  if (f.serviceId !== "all" && !v.serviceIds.includes(f.serviceId)) return false;
  if (f.organisationId !== "all" && !v.organisationIds.includes(f.organisationId)) return false;
  const s = v.start ? datePart(v.start) : undefined;
  const e = v.end ? datePart(v.end) : v.status === "ongoing" ? DEMO_TODAY : s;
  if (f.from && (!e || e < f.from)) return false;
  if (f.to && (!s || s > f.to)) return false;
  if (f.milestonesOnly && !(v.lm.landmarkType !== "marker")) return false;
  if (f.ongoingOnly && v.status !== "ongoing" && v.status !== "awaiting") return false;
  if (f.gapsOnly && v.gaps.length === 0) return false;
  return true;
}

export function activeLandscapeFilterLabels(f: LandscapeFilters, repo: Repo): { key: keyof LandscapeFilters; label: string }[] {
  const out: { key: keyof LandscapeFilters; label: string }[] = [];
  if (f.branchId !== "all") out.push({ key: "branchId", label: `Pathway: ${repo.branch(f.branchId)?.name}` });
  if (f.serviceId !== "all") out.push({ key: "serviceId", label: `Service: ${repo.svcName(f.serviceId)}` });
  if (f.organisationId !== "all") out.push({ key: "organisationId", label: `Provider: ${repo.orgName(f.organisationId)}` });
  if (f.from) out.push({ key: "from", label: `From ${f.from}` });
  if (f.to) out.push({ key: "to", label: `To ${f.to}` });
  if (f.milestonesOnly) out.push({ key: "milestonesOnly", label: "Significant milestones" });
  if (f.ongoingOnly) out.push({ key: "ongoingOnly", label: "Ongoing care" });
  if (f.gapsOnly) out.push({ key: "gapsOnly", label: "Information gaps" });
  return out;
}
