import type { PatientDataset, HealthcareEvent } from "../types";

// Third demonstration patient (fictional). A shorter, mostly well-coordinated journey:
// long-standing asthma care whose start date is not in the record (transferred notes),
// an overseas emergency visit imported later, a respiratory referral, completed private
// physiotherapy, and an upcoming review.

const P = "pt-noor";
const ev = (e: Omit<HealthcareEvent, "patientId" | "linkedEventIds" | "relatedReferralIds"> & Partial<Pick<HealthcareEvent, "linkedEventIds" | "relatedReferralIds">>): HealthcareEvent => ({ patientId: P, linkedEventIds: [], relatedReferralIds: [], ...e });

export const noor: PatientDataset = {
  patient: {
    id: P,
    displayName: "Noor Castellan",
    preferredName: "Noor",
    dateOfBirth: "1999-11-21",
    pronouns: "she/her",
    demonstrationIdentifiers: [
      { label: "Demo patient ID", value: "PW-3391-0624" },
      { label: "Synthetic NHS-style number", value: "999 000 0054" },
    ],
    recordUpdatedAt: "2026-10-25T08:15:00",
    linkedRecordSources: ["src-n-gp", "src-n-hosp", "src-n-lisbon", "src-n-larch"],
    phone: "07700 900 263",
    email: "noor.c@example.com",
    gpOrganisationId: "org-willowmere",
    demoTeaser:
      "A shorter, mostly well-coordinated asthma journey with an emergency visit in Lisbon, a specialist assessment and a care period whose start date isn't recorded.",
    summaryForPatient:
      "Your records show ongoing asthma care with your GP, an emergency visit in Lisbon, an assessment with the hospital's respiratory team and a completed course of private physiotherapy. Your next review is booked.",
  },
  sources: [
    { id: "src-n-gp", organisationId: "org-willowmere", sourceType: "GP clinical system extract", sourceReference: "GPX-WMP-2026-10-25-N", jurisdiction: "England, UK", receivedAt: "2026-10-25T08:15:00", verificationStatus: "Verified", lastUpdatedAt: "2026-10-25T08:15:00", note: "Notes transferred from a previous practice in 2023; earlier asthma history summarised only." },
    { id: "src-n-hosp", organisationId: "org-northvale-hosp", sourceType: "Hospital EPR extract", sourceReference: "NGH-EPR-902215", jurisdiction: "England, UK", receivedAt: "2026-10-23T07:30:00", verificationStatus: "Verified", lastUpdatedAt: "2026-10-23T07:30:00" },
    { id: "src-n-lisbon", organisationId: "org-lisbon", sourceType: "Overseas document (patient supplied)", sourceReference: "Emailed PDF discharge note", jurisdiction: "Portugal", receivedAt: "2026-04-15T10:00:00", verificationStatus: "Partially verified", lastUpdatedAt: "2026-04-15T10:00:00", note: "Portuguese/English bilingual discharge note; hospital letterhead checked by GP." },
    { id: "src-n-larch", organisationId: "org-larchfield", sourceType: "Private clinic letter", sourceReference: "LPC/PHYS/3012", jurisdiction: "England, UK", receivedAt: "2026-08-14T10:00:00", verificationStatus: "Verified", lastUpdatedAt: "2026-08-14T10:00:00" },
  ],
  events: [
    ev({ id: "n-e01", eventType: "Overseas consultation", title: "Emergency visit in Lisbon, Portugal", summary: "Acute asthma attack. Nebulised salbutamol x3; oral prednisolone 40 mg for 5 days. Discharged same day.", plainSummary: "While in Lisbon you had an asthma attack and were treated at a hospital emergency service, then went home the same day with a short steroid course.", occurredAt: "2026-03-28T19:10", endedAt: "2026-03-28T23:30", recordedAt: "2026-04-15T10:00:00", receivedAt: "2026-04-15T10:00:00", organisationId: "org-lisbon", serviceId: "svc-lisbon", status: "Completed", outcome: "Discharged same day with prednisolone course.", sourceRecordId: "src-n-lisbon", linkedEventIds: ["n-e02"], significant: true, metadata: { location: "Lisbon, Portugal" } }),
    ev({ id: "n-e02", eventType: "Review", title: "GP asthma review after attack", summary: "Post-attack review. Inhaler technique checked. Switched to budesonide/formoterol maintenance and reliever (MART). Referral to respiratory clinic.", plainSummary: "Your GP reviewed your asthma after the attack, changed your inhaler and referred you to the hospital's lung specialists.", occurredAt: "2026-04-09T09:00", recordedAt: "2026-04-09T09:30:00", organisationId: "org-willowmere", serviceId: "svc-gp", status: "Completed", outcome: "Inhaler changed; respiratory referral.", sourceRecordId: "src-n-gp", linkedEventIds: ["n-e01", "n-e03"], significant: true }),
    ev({ id: "n-e03", eventType: "Referral", title: "Referral sent to Respiratory clinic", summary: "Routine referral after acute attack abroad; ?asthma phenotype assessment.", plainSummary: "Your GP referred you to the respiratory (lung) clinic.", occurredAt: "2026-04-10", recordedAt: "2026-04-10T12:00:00", organisationId: "org-willowmere", serviceId: "svc-gp", status: "Completed", sourceRecordId: "src-n-gp", linkedEventIds: ["n-e02", "n-e04"], relatedReferralIds: ["ref-n-resp"] }),
    ev({ id: "n-e04", eventType: "Assessment", title: "Respiratory clinic assessment", summary: "Spirometry with reversibility; FeNO 48 ppb. Eosinophilic asthma. Continue MART; personalised asthma action plan. Review in 6 months.", plainSummary: "The lung specialists did breathing tests, confirmed the type of asthma you have and gave you a written asthma action plan.", occurredAt: "2026-06-17T14:00", recordedAt: "2026-06-17T16:00:00", organisationId: "org-northvale-hosp", serviceId: "svc-resp", status: "Completed", outcome: "Continue MART; action plan; review in 6 months.", sourceRecordId: "src-n-hosp", linkedEventIds: ["n-e03", "n-e05", "n-e07"], relatedReferralIds: ["ref-n-resp"], significant: true, metadata: { durationMinutes: 40 } }),
    ev({ id: "n-e05", eventType: "Private consultation", title: "Private physiotherapy (breathing)", summary: "Breathing pattern retraining. 3 sessions, 1 Jul – 12 Aug. Completed.", plainSummary: "You had three private physiotherapy sessions to help with your breathing.", occurredAt: "2026-07-01T18:00", endedAt: "2026-08-12T18:45", recordedAt: "2026-08-14T10:00:00", organisationId: "org-larchfield", serviceId: "svc-physio-priv", status: "Completed", outcome: "Course completed.", sourceRecordId: "src-n-larch", linkedEventIds: ["n-e04"], significant: true }),
    ev({ id: "n-e06", eventType: "GP consultation", title: "Annual asthma review", summary: "Annual review. ACT score 22 (well controlled). Flu vaccine given.", plainSummary: "Your yearly asthma check. Your asthma was well controlled.", occurredAt: "2026-10-07T16:20", recordedAt: "2026-10-07T16:40:00", organisationId: "org-willowmere", serviceId: "svc-gp", status: "Completed", outcome: "Well controlled.", sourceRecordId: "src-n-gp", linkedEventIds: [] }),
    ev({ id: "n-e07", eventType: "Follow-up appointment", title: "Respiratory clinic review (booked)", summary: "6-month review booked.", plainSummary: "Your lung specialist review is booked.", occurredAt: "2026-12-09T09:30", recordedAt: "2026-06-17T16:05:00", organisationId: "org-northvale-hosp", serviceId: "svc-resp", status: "Scheduled", sourceRecordId: "src-n-hosp", linkedEventIds: ["n-e04"], significant: true }),
  ],
  referrals: [
    { id: "ref-n-resp", patientId: P, referringOrganisationId: "org-willowmere", receivingOrganisationId: "org-northvale-hosp", referringServiceId: "svc-gp", receivingServiceId: "svc-resp", createdAt: "2026-04-10", sentAt: "2026-04-10", receivedAt: "2026-04-14", decisionAt: "2026-04-30", currentStatus: "Assessment completed", reason: "Acute asthma attack requiring emergency treatment abroad.", outcome: "Assessed 17 Jun 2026.", priority: "Routine", responsibleRoleId: "Respiratory consultant", linkedEventIds: ["n-e03", "n-e04"], sourceRecordId: "src-n-hosp", lastUpdatedAt: "2026-06-17T16:00:00",
      statusHistory: [{ status: "Sent", at: "2026-04-10" }, { status: "Received", at: "2026-04-14" }, { status: "Accepted", at: "2026-04-30" }, { status: "Assessment completed", at: "2026-06-17" }] },
  ],
  appointments: [
    { id: "ap-n-01", patientId: P, organisationId: "org-northvale-hosp", serviceId: "svc-resp", scheduledAt: "2026-06-17T14:00", durationMinutes: 40, appointmentType: "New patient clinic", status: "Attended", outcome: "Eosinophilic asthma; continue MART.", linkedReferralId: "ref-n-resp", location: "Respiratory outpatients, Northvale General Hospital", followUpEventIds: ["n-e07"], eventId: "n-e04" },
    { id: "ap-n-02", patientId: P, organisationId: "org-willowmere", serviceId: "svc-gp", scheduledAt: "2026-10-07T16:20", durationMinutes: 20, appointmentType: "Asthma review (practice nurse)", status: "Attended", outcome: "Well controlled.", location: "Willowmere Medical Practice", followUpEventIds: [], eventId: "n-e06" },
    { id: "ap-n-03", patientId: P, organisationId: "org-northvale-hosp", serviceId: "svc-resp", scheduledAt: "2026-12-09T09:30", durationMinutes: 20, appointmentType: "Follow-up clinic", status: "Scheduled", linkedReferralId: "ref-n-resp", location: "Respiratory outpatients, Northvale General Hospital", followUpEventIds: [], eventId: "n-e07" },
  ],
  medications: [
    { id: "m-n-01", patientId: P, medicationName: "Beclometasone", recordedDose: "100 micrograms, 2 puffs", route: "Inhaled", frequency: "Twice daily", status: "Stopped", startDate: undefined, endDate: "2026-04-09", recordType: "Prescription", organisationId: "org-willowmere", sourceRecordId: "src-n-gp", lastUpdatedAt: "2026-04-09T09:30:00", medicationGroup: "ics", linkedEventIds: ["n-e02"], note: "Start date not recorded (transferred notes)." },
    { id: "m-n-02", patientId: P, medicationName: "Budesonide/formoterol", recordedDose: "200/6 micrograms, 1 puff", route: "Inhaled", frequency: "Twice daily and as needed (MART)", startDate: "2026-04-09", status: "Active", recordType: "Prescription", organisationId: "org-willowmere", sourceRecordId: "src-n-gp", lastUpdatedAt: "2026-10-07T16:40:00", medicationGroup: "mart", linkedEventIds: ["n-e02", "n-e04"] },
    { id: "m-n-03", patientId: P, medicationName: "Prednisolone", recordedDose: "40 mg", route: "Oral", frequency: "Once daily for 5 days", startDate: "2026-03-28", endDate: "2026-04-01", status: "Completed course", recordType: "Overseas prescription", organisationId: "org-lisbon", sourceRecordId: "src-n-lisbon", lastUpdatedAt: "2026-04-15T10:00:00", medicationGroup: "prednisolone", linkedEventIds: ["n-e01"] },
  ],
  episodes: [
    { id: "ep-n-gp", patientId: P, title: "Asthma care with GP practice", plainTitle: "Asthma care with your GP", status: "Ongoing", relatedEventIds: ["n-e02", "n-e06"], participatingServiceIds: ["svc-gp"], episodeKind: "Community" },
    { id: "ep-n-resp", patientId: P, title: "Respiratory specialist care", plainTitle: "Care from the lung specialists", startDate: "2026-06-17", status: "Ongoing", relatedEventIds: ["n-e04", "n-e07"], participatingServiceIds: ["svc-resp"], episodeKind: "Specialist clinic" },
    { id: "ep-n-physio", patientId: P, title: "Private breathing physiotherapy", plainTitle: "Private physiotherapy", startDate: "2026-07-01", endDate: "2026-08-12", status: "Completed", relatedEventIds: ["n-e05"], participatingServiceIds: ["svc-physio-priv"], episodeKind: "Private", outcome: "Course completed." },
  ],
  teams: [
    { id: "t-n-gp", patientId: P, serviceId: "svc-gp", involvementStatus: "Current", responsibilityDescription: "Usual asthma care; start of involvement not recorded (transferred notes).", roleInJourney: "Usual care" },
    { id: "t-n-lis", patientId: P, serviceId: "svc-lisbon", startDate: "2026-03-28", endDate: "2026-03-28", involvementStatus: "Historical", responsibilityDescription: "Emergency treatment abroad.", roleInJourney: "Overseas emergency care" },
    { id: "t-n-resp", patientId: P, serviceId: "svc-resp", startDate: "2026-06-17", involvementStatus: "Current", responsibilityDescription: "Specialist review booked 9 Dec 2026.", roleInJourney: "Specialist assessment" },
    { id: "t-n-physio", patientId: P, serviceId: "svc-physio-priv", startDate: "2026-07-01", endDate: "2026-08-12", involvementStatus: "Historical", responsibilityDescription: "Breathing pattern physiotherapy (self-funded).", roleInJourney: "Private care" },
  ],
  documents: [
    { id: "d-n-01", patientId: P, title: "Emergency discharge note — Lisbon", documentType: "Overseas record", organisationId: "org-lisbon", eventId: "n-e01", documentDate: "2026-03-28", statedEventDate: "2026-03-28", receivedAt: "2026-04-15T10:00:00", availabilityStatus: "Available", sourceRecordId: "src-n-lisbon", language: "Portuguese and English",
      syntheticContent: "Diagnosis: acute asthma exacerbation.\n\nTreatment: nebulised salbutamol x3; oral prednisolone 40 mg.\n\nDischarge: home, prednisolone 40 mg daily for 5 days. Follow up with own doctor." },
    { id: "d-n-02", patientId: P, title: "Respiratory clinic letter", documentType: "Clinical correspondence", organisationId: "org-northvale-hosp", eventId: "n-e04", documentDate: "2026-06-18", statedEventDate: "2026-06-17", receivedAt: "2026-06-19T09:00:00", availabilityStatus: "Available", sourceRecordId: "src-n-hosp",
      syntheticContent: "Spirometry: FEV1 78% predicted with 14% reversibility. FeNO 48 ppb.\n\nImpression: eosinophilic asthma, now controlled on MART.\n\nPlan: continue budesonide/formoterol MART; written asthma action plan given; review 6 months." },
    { id: "d-n-03", patientId: P, title: "Physiotherapy completion letter", documentType: "Clinical correspondence", organisationId: "org-larchfield", eventId: "n-e05", documentDate: "2026-08-13", receivedAt: "2026-08-14T10:00:00", availabilityStatus: "Available", sourceRecordId: "src-n-larch",
      syntheticContent: "Three sessions of breathing pattern retraining completed. Nijmegen score improved from 27 to 14. Discharged with home exercises." },
  ],
  actions: [
    { id: "a-n-01", patientId: P, title: "Respiratory clinic review", plainTitle: "Lung specialist appointment", description: "6-month review booked.", status: "Scheduled", responsibleRoleId: "Respiratory consultant", responsibleServiceId: "svc-resp", dueAt: "2026-12-09", sourceEventIds: ["n-e07"], createdAt: "2026-06-17", updatedAt: "2026-06-17" },
  ],
  audit: [
    { id: "au-n-01", patientId: P, actorRole: "Integration service", actionType: "Record imported", entityType: "RecordSource", entityId: "src-n-gp", occurredAt: "2026-10-25T08:15:00", description: "GP extract imported." },
    { id: "au-n-02", patientId: P, actorRole: "GP administrator", actionType: "Document linked", entityType: "Document", entityId: "d-n-01", occurredAt: "2026-04-15T10:05:00", description: "Overseas discharge note linked to overseas event." },
  ],
  branches: [
    { id: "b-n-main", patientId: P, name: "Asthma care", plainName: "Asthma care", lane: 0 },
    { id: "b-n-priv", patientId: P, name: "Private physiotherapy", plainName: "Physiotherapy", parentBranchId: "b-n-main", lane: 1 },
  ],
  landmarks: [
    { id: "lm-n-01", patientId: P, landmarkType: "campsite", title: "Asthma care with GP", linkedEventIds: ["n-e02", "n-e06"], linkedCareEpisodeId: "ep-n-gp", trailBranchId: "b-n-main", displayOrder: 1 },
    { id: "lm-n-02", patientId: P, landmarkType: "marker", title: "Emergency visit in Lisbon", linkedEventIds: ["n-e01"], trailBranchId: "b-n-main", displayOrder: 2, visualVariant: "overseas" },
    { id: "lm-n-03", patientId: P, landmarkType: "signpost", title: "Referral: lung specialists", linkedEventIds: ["n-e02", "n-e03"], linkedReferralId: "ref-n-resp", trailBranchId: "b-n-main", displayOrder: 3 },
    { id: "lm-n-04", patientId: P, landmarkType: "viewpoint", title: "Respiratory assessment", linkedEventIds: ["n-e04"], trailBranchId: "b-n-main", displayOrder: 4 },
    { id: "lm-n-05", patientId: P, landmarkType: "campsite", title: "Private physiotherapy", linkedEventIds: ["n-e05"], linkedCareEpisodeId: "ep-n-physio", trailBranchId: "b-n-priv", displayOrder: 5, visualVariant: "private" },
    { id: "lm-n-06", patientId: P, landmarkType: "marker", title: "Annual asthma review", linkedEventIds: ["n-e06"], trailBranchId: "b-n-main", displayOrder: 6 },
    { id: "lm-n-07", patientId: P, landmarkType: "viewpoint", title: "Review: 9 Dec", linkedEventIds: ["n-e07"], trailBranchId: "b-n-main", displayOrder: 7 },
  ],
  organisations: [],
  services: [],
};
