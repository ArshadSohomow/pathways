// Validates referential integrity of the synthetic dataset and prints the derived findings.
// Run: npx tsx scripts/validate.ts   (exits non-zero on any broken relationship)
import { ALL_RAW, getRepo } from "../src/lib/repo";
import { detectGaps } from "../src/lib/gaps";
import { buildLandmarks } from "../src/lib/landmarks";
import { organisations, services } from "../src/data/organisations";

let errors = 0;
const fail = (m: string) => { errors++; console.error("  ✗ " + m); };
const orgIds = new Set(organisations.map((o) => o.id));
const svcIds = new Set(services.map((s) => s.id));
services.forEach((s) => orgIds.has(s.organisationId) || fail(`service ${s.id} → missing org ${s.organisationId}`));

for (const raw of ALL_RAW) {
  console.log(`\n${raw.patient.displayName} (${raw.patient.id})`);
  const ids = new Set<string>();
  const all = [...raw.events, ...raw.referrals, ...raw.appointments, ...raw.medications, ...raw.episodes, ...raw.teams, ...raw.documents, ...raw.actions, ...raw.sources, ...raw.audit, ...raw.landmarks, ...raw.branches];
  all.forEach((x) => { if (ids.has(x.id)) fail(`duplicate id ${x.id}`); ids.add(x.id); });
  const ev = new Set(raw.events.map((e) => e.id));
  const ref = new Set(raw.referrals.map((r) => r.id));
  const src = new Set(raw.sources.map((s) => s.id));
  const ep = new Set(raw.episodes.map((e) => e.id));
  const br = new Set(raw.branches.map((b) => b.id));
  for (const e of raw.events) {
    orgIds.has(e.organisationId) || fail(`${e.id} org ${e.organisationId}`);
    svcIds.has(e.serviceId) || fail(`${e.id} service ${e.serviceId}`);
    src.has(e.sourceRecordId) || fail(`${e.id} source ${e.sourceRecordId}`);
    e.linkedEventIds.forEach((l) => ev.has(l) || fail(`${e.id} → event ${l}`));
    e.relatedReferralIds.forEach((r) => ref.has(r) || fail(`${e.id} → referral ${r}`));
    if (e.endedAt && e.endedAt < e.occurredAt) fail(`${e.id} ends before it starts`);
    const svc = services.find((s) => s.id === e.serviceId);
    if (svc && svc.organisationId !== e.organisationId) fail(`${e.id} service ${e.serviceId} belongs to ${svc.organisationId}, not ${e.organisationId}`);
  }
  for (const r of raw.referrals) {
    [r.referringServiceId, r.receivingServiceId].forEach((s) => svcIds.has(s) || fail(`${r.id} svc ${s}`));
    r.linkedEventIds.forEach((l) => ev.has(l) || fail(`${r.id} → event ${l}`));
    if (r.receivedAt && r.sentAt && r.receivedAt < r.sentAt) fail(`${r.id} received before sent`);
  }
  raw.appointments.forEach((a) => { (a.eventId && !ev.has(a.eventId)) && fail(`${a.id} → event ${a.eventId}`); a.followUpEventIds.forEach((f) => ev.has(f) || fail(`${a.id} → followup ${f}`)); if (a.linkedReferralId && !ref.has(a.linkedReferralId)) fail(`${a.id} → referral`); });
  raw.medications.forEach((m) => { src.has(m.sourceRecordId) || fail(`${m.id} source`); m.linkedEventIds.forEach((l) => ev.has(l) || fail(`${m.id} → event ${l}`)); });
  raw.episodes.forEach((e) => { e.relatedEventIds.forEach((l) => ev.has(l) || fail(`${e.id} → event ${l}`)); e.participatingServiceIds.forEach((s) => svcIds.has(s) || fail(`${e.id} svc ${s}`)); if (e.status === "Ongoing" && e.endDate) fail(`${e.id} ongoing with end date`); });
  raw.documents.forEach((d) => { if (d.eventId && !ev.has(d.eventId)) fail(`${d.id} → event`); src.has(d.sourceRecordId) || fail(`${d.id} source`); if (d.availabilityStatus !== "Referenced, not received" && !d.syntheticContent) fail(`${d.id} available but no content`); });
  raw.actions.forEach((a) => a.sourceEventIds.forEach((l) => ev.has(l) || fail(`${a.id} → event ${l}`)));
  raw.teams.forEach((t) => svcIds.has(t.serviceId) || fail(`${t.id} svc`));
  raw.landmarks.forEach((l) => { l.linkedEventIds.forEach((x) => ev.has(x) || fail(`${l.id} → event ${x}`)); if (l.linkedReferralId && !ref.has(l.linkedReferralId)) fail(`${l.id} → referral`); if (l.linkedCareEpisodeId && !ep.has(l.linkedCareEpisodeId)) fail(`${l.id} → episode`); br.has(l.trailBranchId) || fail(`${l.id} → branch`); });

  const repo = getRepo(raw.patient.id);
  const gaps = detectGaps(repo);
  console.log(`  ${gaps.length} information-gap findings:`);
  gaps.forEach((g) => console.log(`   [${g.ruleId}] ${g.category} — ${g.title}  → landmarks: ${g.landmarkIds.join(", ") || "none"}`));
  const vms = buildLandmarks(repo, gaps);
  console.log(`  landmarks:`);
  vms.forEach((v) => console.log(`   ${v.lm.displayOrder}. ${v.lm.landmarkType.padEnd(9)} ${v.lm.title.padEnd(32)} ${v.status.padEnd(12)} ${v.statusLabel.padEnd(22)} ${v.start ?? "?"} → ${v.end ?? "-"} ${v.duration ? "| " + v.duration.label : ""}${v.isCurrent ? "  ◀ current" : ""}`));
}
console.log(errors ? `\n${errors} error(s)` : "\nAll relationships valid.");
process.exit(errors ? 1 : 0);
