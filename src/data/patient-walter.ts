import type { PatientDataset, HealthcareEvent } from "../types";

// Second demonstration patient (fictional). Older adult: falls referral, hip fracture,
// emergency admission, discharge with a community rehabilitation referral that the
// receiving service has not recorded, and a cancelled falls appointment never rebooked.

const P = "pt-walter";
const ev = (e: Omit<HealthcareEvent, "patientId" | "linkedEventIds" | "relatedReferralIds"> & Partial<Pick<HealthcareEvent, "linkedEventIds" | "relatedReferralIds">>): HealthcareEvent => ({ patientId: P, linkedEventIds: [], relatedReferralIds: [], ...e });

export const walter: PatientDataset = {
  patient: {
    id: P,
    displayName: "Walter Quayle",
    preferredName: "Walter",
    dateOfBirth: "1944-09-03",
    pronouns: "he/him",
    demonstrationIdentifiers: [
      { label: "Demo patient ID", value: "PW-2207-1158" },
      { label: "Synthetic NHS-style number", value: "999 000 0038" },
    ],
    recordUpdatedAt: "2026-10-22T11:40:00",
    linkedRecordSources: ["src-w-gp", "src-w-hosp", "src-w-comm", "src-w-amb", "src-w-larch"],
    address: "2 Kingfisher Row, Heronbridge HB1 4TE (fictional)",
    phone: "01632 960 077",
    gpOrganisationId: "org-heronbridge",
    communicationNeeds: "Hearing aids: please speak clearly. Daughter (Margaret) helps with appointments, with Walter's consent.",
    demoTeaser:
      "An older adult's fall and hip fracture, a hospital stay, and a rehabilitation referral the receiving team never recorded — a handover gap made visible.",
    summaryForPatient:
      "Your records show a hospital stay after a fall and a broken hip. A referral for rehabilitation at home was sent when you left hospital, but the rehabilitation team has not recorded receiving it.",
  },
  sources: [
    { id: "src-w-gp", organisationId: "org-heronbridge", sourceType: "GP clinical system extract", sourceReference: "GPX-HBS-2026-10-22", jurisdiction: "England, UK", receivedAt: "2026-10-22T11:40:00", verificationStatus: "Verified", lastUpdatedAt: "2026-10-22T11:40:00" },
    { id: "src-w-hosp", organisationId: "org-northvale-hosp", sourceType: "Hospital EPR extract", sourceReference: "NGH-EPR-771920", jurisdiction: "England, UK", receivedAt: "2026-10-21T07:30:00", verificationStatus: "Verified", lastUpdatedAt: "2026-10-21T07:30:00" },
    { id: "src-w-comm", organisationId: "org-northvale-comm", sourceType: "Community system extract", sourceReference: "NCHS-CS-60233", jurisdiction: "England, UK", receivedAt: "2026-10-20T12:00:00", verificationStatus: "Verified", lastUpdatedAt: "2026-10-20T12:00:00" },
    { id: "src-w-amb", organisationId: "org-ambulance", sourceType: "Ambulance record", sourceReference: "GVAS-ePCR-26-060341", jurisdiction: "England, UK", receivedAt: "2026-06-04T08:00:00", verificationStatus: "Verified", lastUpdatedAt: "2026-06-04T08:00:00" },
    { id: "src-w-larch", organisationId: "org-larchfield", sourceType: "Private clinic letter", sourceReference: "LPC/PHYS/2290", jurisdiction: "England, UK", receivedAt: "2026-09-30T10:00:00", verificationStatus: "Partially verified", lastUpdatedAt: "2026-09-30T10:00:00" },
  ],
  events: [
    ev({ id: "w-e01", eventType: "GP consultation", title: "GP consultation: dizziness and falls", summary: "Two falls in 3 months; dizziness on standing. Lying/standing BP drop 24 mmHg. Amlodipine reduced. Referral to falls prevention service.", plainSummary: "You saw your GP about dizziness and two recent falls. Your GP reduced a blood pressure tablet and referred you to the falls prevention service.", occurredAt: "2026-05-11T10:00", recordedAt: "2026-05-11T10:30:00", organisationId: "org-heronbridge", serviceId: "svc-gp-heron", status: "Completed", outcome: "Amlodipine reduced; falls referral.", sourceRecordId: "src-w-gp", linkedEventIds: ["w-e02"], significant: true }),
    ev({ id: "w-e02", eventType: "Referral", title: "Referral sent to Falls prevention service", summary: "Routine referral for multifactorial falls assessment.", plainSummary: "Your GP referred you to the falls prevention service.", occurredAt: "2026-05-12", recordedAt: "2026-05-12T09:00:00", organisationId: "org-heronbridge", serviceId: "svc-gp-heron", status: "Completed", sourceRecordId: "src-w-gp", linkedEventIds: ["w-e01", "w-e10"], relatedReferralIds: ["ref-w-falls"] }),
    ev({ id: "w-e03", eventType: "Ambulance attendance", title: "Ambulance: fall at home", summary: "Found on floor by daughter. Unable to weight-bear, shortened externally rotated left leg. Conveyed to ED.", plainSummary: "An ambulance took you to hospital after a fall at home.", occurredAt: "2026-06-03T21:05", recordedAt: "2026-06-03T22:20:00", organisationId: "org-ambulance", serviceId: "svc-amb", status: "Completed", sourceRecordId: "src-w-amb", linkedEventIds: ["w-e04"], significant: true, metadata: { location: "Home" } }),
    ev({ id: "w-e04", eventType: "Emergency department presentation", title: "Emergency Department", summary: "X-ray: left intracapsular neck of femur fracture. Referred to orthopaedics.", plainSummary: "In the Emergency Department an X-ray showed a broken left hip.", occurredAt: "2026-06-03T22:10", endedAt: "2026-06-04T01:40", recordedAt: "2026-06-04T02:00:00", organisationId: "org-northvale-hosp", serviceId: "svc-ed", status: "Completed", outcome: "Admitted under orthopaedics.", sourceRecordId: "src-w-hosp", linkedEventIds: ["w-e03", "w-e05"], significant: true, metadata: { arrivalMethod: "Ambulance" } }),
    ev({ id: "w-e05", eventType: "Admission", title: "Admitted to Trauma & orthopaedics", summary: "Admitted to Ward 4 for surgical management of hip fracture.", plainSummary: "You were admitted to the orthopaedic ward (Ward 4).", occurredAt: "2026-06-04T01:40", recordedAt: "2026-06-04T02:10:00", organisationId: "org-northvale-hosp", serviceId: "svc-ortho", status: "Completed", sourceRecordId: "src-w-hosp", linkedEventIds: ["w-e04", "w-e06"], significant: true, metadata: { reason: "Left hip fracture" } }),
    ev({ id: "w-e06", eventType: "Procedure", title: "Hip operation (hemiarthroplasty)", summary: "Left hip hemiarthroplasty under spinal anaesthetic. Uncomplicated.", plainSummary: "You had an operation to repair your hip.", occurredAt: "2026-06-05T09:30", recordedAt: "2026-06-05T13:00:00", organisationId: "org-northvale-hosp", serviceId: "svc-ortho", status: "Completed", sourceRecordId: "src-w-hosp", linkedEventIds: ["w-e05", "w-e07"] }),
    ev({ id: "w-e07", eventType: "Medication change", title: "Bone protection started", summary: "Alendronic acid 70 mg weekly and calcium/vitamin D started.", plainSummary: "You started medicines to protect your bones.", occurredAt: "2026-06-12", recordedAt: "2026-06-12T12:00:00", organisationId: "org-northvale-hosp", serviceId: "svc-ortho", status: "Completed", sourceRecordId: "src-w-hosp", linkedEventIds: ["w-e06", "w-e08"] }),
    ev({ id: "w-e08", eventType: "Discharge", title: "Discharged home from hospital", summary: "Discharged home with walking frame. Referral to community rehabilitation team sent. Fracture clinic in 6 weeks.", plainSummary: "You went home from hospital with a walking frame. The hospital sent a referral for rehabilitation at home.", occurredAt: "2026-06-16T15:00", recordedAt: "2026-06-16T17:00:00", organisationId: "org-northvale-hosp", serviceId: "svc-ortho", status: "Completed", outcome: "Home; community rehabilitation referral sent.", sourceRecordId: "src-w-hosp", linkedEventIds: ["w-e07", "w-e09"], relatedReferralIds: ["ref-w-rehab"], significant: true, metadata: { dischargeDestination: "Home", followUpExpected: true } }),
    ev({ id: "w-e09", eventType: "Referral", title: "Referral sent to Community rehabilitation", summary: "Electronic referral for home physiotherapy and OT. No receipt recorded by community services.", plainSummary: "The hospital sent a referral to the community rehabilitation team. The team has not recorded receiving it.", occurredAt: "2026-06-16", recordedAt: "2026-06-16T16:40:00", organisationId: "org-northvale-hosp", serviceId: "svc-ortho", status: "Awaiting update", sourceRecordId: "src-w-hosp", linkedEventIds: ["w-e08"], relatedReferralIds: ["ref-w-rehab"], significant: true }),
    ev({ id: "w-e10", eventType: "Outpatient appointment", title: "Falls service appointment (cancelled)", summary: "Cancelled by service: patient was an inpatient. No rebooking recorded.", plainSummary: "Your falls service appointment was cancelled because you were in hospital. The records do not show a new appointment.", occurredAt: "2026-06-25T11:00", recordedAt: "2026-06-05T09:00:00", organisationId: "org-northvale-comm", serviceId: "svc-falls", status: "Cancelled", sourceRecordId: "src-w-comm", linkedEventIds: ["w-e02"], relatedReferralIds: ["ref-w-falls"] }),
    ev({ id: "w-e11", eventType: "GP consultation", title: "GP medication review (telephone)", summary: "Post-discharge medication review with daughter present. Alendronic acid added to repeat. Patient reports arranging private physiotherapy as no contact from community rehab.", plainSummary: "Your GP phoned to review your medicines after hospital. You mentioned you had arranged private physiotherapy.", occurredAt: "2026-07-02T14:30", recordedAt: "2026-07-02T14:50:00", organisationId: "org-heronbridge", serviceId: "svc-gp-heron", status: "Completed", outcome: "Medicines reconciled; private physio noted (patient report).", sourceRecordId: "src-w-gp", linkedEventIds: ["w-e08"] }),
    ev({ id: "w-e12", eventType: "Outpatient appointment", title: "Fracture clinic", summary: "6-week review. Wound healed; X-ray satisfactory. Continue mobilising. Review in 4 months.", plainSummary: "At the fracture clinic, your hip was healing well.", occurredAt: "2026-07-28T14:00", recordedAt: "2026-07-28T16:00:00", organisationId: "org-northvale-hosp", serviceId: "svc-ortho", status: "Completed", outcome: "Healing well; review in 4 months.", sourceRecordId: "src-w-hosp", linkedEventIds: ["w-e08"], significant: true }),
    ev({ id: "w-e13", eventType: "Private consultation", title: "Private physiotherapy: first session", summary: "Self-funded. Home exercise programme; gait re-education.", plainSummary: "Your first private physiotherapy session.", occurredAt: "2026-07-09T10:00", recordedAt: "2026-07-10T09:00:00", organisationId: "org-larchfield", serviceId: "svc-physio-priv", status: "Completed", sourceRecordId: "src-w-larch", linkedEventIds: ["w-e11"], significant: true, metadata: { durationMinutes: 45 } }),
    ev({ id: "w-e14", eventType: "Private consultation", title: "Private physiotherapy: progress review", summary: "Walking with stick indoors. Continue fortnightly.", plainSummary: "Physiotherapy review: you were walking indoors with a stick.", occurredAt: "2026-09-17T10:00", recordedAt: "2026-09-30T10:00:00", organisationId: "org-larchfield", serviceId: "svc-physio-priv", status: "Completed", sourceRecordId: "src-w-larch", linkedEventIds: ["w-e13"], metadata: { durationMinutes: 45 } }),
    ev({ id: "w-e15", eventType: "Follow-up appointment", title: "Fracture clinic review (booked)", summary: "4-month review booked.", plainSummary: "You have a fracture clinic review booked.", occurredAt: "2026-11-24T14:00", recordedAt: "2026-07-28T16:05:00", organisationId: "org-northvale-hosp", serviceId: "svc-ortho", status: "Scheduled", sourceRecordId: "src-w-hosp", linkedEventIds: ["w-e12"], significant: true }),
  ],
  referrals: [
    { id: "ref-w-falls", patientId: P, referringOrganisationId: "org-heronbridge", receivingOrganisationId: "org-northvale-comm", referringServiceId: "svc-gp-heron", receivingServiceId: "svc-falls", createdAt: "2026-05-12", sentAt: "2026-05-12", receivedAt: "2026-05-15", decisionAt: "2026-05-22", currentStatus: "Appointment scheduled", reason: "Recurrent falls; orthostatic hypotension.", outcome: "Accepted; appointment 25 Jun was cancelled (inpatient). No rebooking recorded.", priority: "Routine", responsibleRoleId: "Falls prevention service", linkedEventIds: ["w-e02", "w-e10"], sourceRecordId: "src-w-comm", lastUpdatedAt: "2026-06-05T09:00:00",
      statusHistory: [{ status: "Sent", at: "2026-05-12" }, { status: "Received", at: "2026-05-15" }, { status: "Accepted", at: "2026-05-22" }, { status: "Appointment scheduled", at: "2026-05-22", note: "25 Jun — later cancelled" }] },
    { id: "ref-w-rehab", patientId: P, referringOrganisationId: "org-northvale-hosp", receivingOrganisationId: "org-northvale-comm", referringServiceId: "svc-ortho", receivingServiceId: "svc-rehab", createdAt: "2026-06-16", sentAt: "2026-06-16", currentStatus: "Sent", reason: "Home rehabilitation after left hip hemiarthroplasty.", priority: "Urgent", linkedEventIds: ["w-e08", "w-e09"], sourceRecordId: "src-w-hosp", lastUpdatedAt: "2026-06-16T16:40:00",
      statusHistory: [{ status: "Sent", at: "2026-06-16" }] },
  ],
  appointments: [
    { id: "ap-w-01", patientId: P, organisationId: "org-northvale-comm", serviceId: "svc-falls", scheduledAt: "2026-06-25T11:00", appointmentType: "Falls assessment", status: "Cancelled", outcome: "Cancelled by service (patient in hospital). No rebooking recorded.", linkedReferralId: "ref-w-falls", location: "Heronbridge Health Centre", followUpEventIds: [], eventId: "w-e10" },
    { id: "ap-w-02", patientId: P, organisationId: "org-northvale-hosp", serviceId: "svc-ortho", scheduledAt: "2026-07-28T14:00", durationMinutes: 20, appointmentType: "Fracture clinic", status: "Attended", outcome: "Healing well.", location: "Fracture clinic, Northvale General Hospital", followUpEventIds: ["w-e15"], eventId: "w-e12" },
    { id: "ap-w-03", patientId: P, organisationId: "org-larchfield", serviceId: "svc-physio-priv", scheduledAt: "2026-07-09T10:00", durationMinutes: 45, appointmentType: "Private physiotherapy", status: "Attended", location: "Home visit", followUpEventIds: ["w-e14"], eventId: "w-e13" },
    { id: "ap-w-04", patientId: P, organisationId: "org-larchfield", serviceId: "svc-physio-priv", scheduledAt: "2026-09-17T10:00", durationMinutes: 45, appointmentType: "Private physiotherapy", status: "Attended", location: "Home visit", followUpEventIds: [], eventId: "w-e14" },
    { id: "ap-w-05", patientId: P, organisationId: "org-northvale-hosp", serviceId: "svc-ortho", scheduledAt: "2026-11-24T14:00", durationMinutes: 20, appointmentType: "Fracture clinic review", status: "Scheduled", location: "Fracture clinic, Northvale General Hospital", followUpEventIds: [], eventId: "w-e15" },
  ],
  medications: [
    { id: "m-w-01", patientId: P, medicationName: "Amlodipine", recordedDose: "10 mg", route: "Oral", frequency: "Once daily", startDate: "2021-03-01", endDate: "2026-05-11", status: "Changed", recordType: "Prescription", organisationId: "org-heronbridge", sourceRecordId: "src-w-gp", lastUpdatedAt: "2026-05-11T10:30:00", medicationGroup: "amlodipine", linkedEventIds: ["w-e01"] },
    { id: "m-w-02", patientId: P, medicationName: "Amlodipine", recordedDose: "5 mg", route: "Oral", frequency: "Once daily", startDate: "2026-05-11", status: "Active", recordType: "Prescription", organisationId: "org-heronbridge", sourceRecordId: "src-w-gp", lastUpdatedAt: "2026-10-03T09:00:00", medicationGroup: "amlodipine", linkedEventIds: ["w-e01", "w-e11"] },
    { id: "m-w-03", patientId: P, medicationName: "Alendronic acid", recordedDose: "70 mg", route: "Oral", frequency: "Once weekly", startDate: "2026-06-12", status: "Active", recordType: "Prescription", organisationId: "org-heronbridge", sourceRecordId: "src-w-gp", lastUpdatedAt: "2026-10-03T09:00:00", medicationGroup: "alendronic", linkedEventIds: ["w-e07", "w-e11"] },
    { id: "m-w-04", patientId: P, medicationName: "Colecalciferol with calcium carbonate", recordedDose: "400 units / 1.5 g", route: "Oral", frequency: "Twice daily", startDate: "2026-06-12", status: "Active", recordType: "Prescription", organisationId: "org-heronbridge", sourceRecordId: "src-w-gp", lastUpdatedAt: "2026-10-03T09:00:00", medicationGroup: "calcium", linkedEventIds: ["w-e07", "w-e11"] },
  ],
  episodes: [
    { id: "ep-w-inpt", patientId: P, title: "Hospital stay: hip fracture", plainTitle: "Hospital stay", startDate: "2026-06-04", endDate: "2026-06-16", status: "Completed", relatedEventIds: ["w-e05", "w-e06", "w-e07", "w-e08"], participatingServiceIds: ["svc-ortho"], episodeKind: "Inpatient", outcome: "Discharged home." },
    { id: "ep-w-physio", patientId: P, title: "Private physiotherapy", plainTitle: "Private physiotherapy", startDate: "2026-07-09", status: "Ongoing", relatedEventIds: ["w-e13", "w-e14"], participatingServiceIds: ["svc-physio-priv"], episodeKind: "Private" },
    { id: "ep-w-ortho", patientId: P, title: "Fracture clinic follow-up", plainTitle: "Fracture clinic", startDate: "2026-07-28", status: "Ongoing", relatedEventIds: ["w-e12", "w-e15"], participatingServiceIds: ["svc-ortho"], episodeKind: "Outpatient" },
  ],
  teams: [
    { id: "t-w-gp", patientId: P, serviceId: "svc-gp-heron", involvementStatus: "Current", responsibilityDescription: "Registered GP practice; repeat prescribing.", roleInJourney: "Usual care" },
    { id: "t-w-amb", patientId: P, serviceId: "svc-amb", startDate: "2026-06-03", endDate: "2026-06-03", involvementStatus: "Historical", responsibilityDescription: "Emergency transport.", roleInJourney: "Emergency transport" },
    { id: "t-w-ed", patientId: P, serviceId: "svc-ed", startDate: "2026-06-03", endDate: "2026-06-04", involvementStatus: "Historical", responsibilityDescription: "Emergency assessment.", roleInJourney: "Emergency presentation" },
    { id: "t-w-ortho", patientId: P, serviceId: "svc-ortho", startDate: "2026-06-04", involvementStatus: "Current", responsibilityDescription: "Surgery, inpatient care and fracture clinic follow-up.", roleInJourney: "Inpatient and outpatient orthopaedic care" },
    { id: "t-w-rehab", patientId: P, serviceId: "svc-rehab", involvementStatus: "Referred, not yet involved", responsibilityDescription: "Referral sent 16 Jun 2026; no receipt recorded.", roleInJourney: "Open referral" },
    { id: "t-w-falls", patientId: P, serviceId: "svc-falls", startDate: "2026-05-22", involvementStatus: "Referred, not yet involved", responsibilityDescription: "Accepted 22 May; appointment cancelled 25 Jun; no rebooking recorded.", roleInJourney: "Falls assessment" },
    { id: "t-w-physio", patientId: P, serviceId: "svc-physio-priv", startDate: "2026-07-09", involvementStatus: "Current", responsibilityDescription: "Self-funded home physiotherapy.", roleInJourney: "Private care" },
  ],
  documents: [
    { id: "d-w-01", patientId: P, title: "Hospital discharge summary", documentType: "Discharge summary", organisationId: "org-northvale-hosp", eventId: "w-e08", documentDate: "2026-06-16", statedEventDate: "2026-06-16", receivedAt: "2026-06-16T17:00:00", availabilityStatus: "Available", sourceRecordId: "src-w-hosp",
      syntheticContent: "Admitted 04/06/2026 following a fall at home. Left intracapsular neck of femur fracture; hemiarthroplasty 05/06/2026.\n\nNew medicines: Alendronic acid 70 mg weekly; calcium/vitamin D twice daily.\n\nFollow-up: Community rehabilitation referral sent. Fracture clinic in 6 weeks.\n\nGP: please continue bone protection." },
    { id: "d-w-02", patientId: P, title: "Referral to Community rehabilitation", documentType: "Referral letter", organisationId: "org-northvale-hosp", eventId: "w-e09", documentDate: "2026-06-16", receivedAt: "2026-06-16T16:40:00", availabilityStatus: "Available", sourceRecordId: "src-w-hosp",
      syntheticContent: "Request: home physiotherapy and occupational therapy following left hip hemiarthroplasty. Mobilising with frame. Lives alone; daughter visits daily." },
    { id: "d-w-03", patientId: P, title: "Fracture clinic letter", documentType: "Clinical correspondence", organisationId: "org-northvale-hosp", eventId: "w-e12", documentDate: "2026-07-29", statedEventDate: "2026-07-28", receivedAt: "2026-07-30T09:00:00", availabilityStatus: "Available", sourceRecordId: "src-w-hosp",
      syntheticContent: "Seen 28/07/2026. Wound healed. X-ray: satisfactory position of hemiarthroplasty. Review in 4 months." },
    { id: "d-w-04", patientId: P, title: "Private physiotherapy progress letter", documentType: "Clinical correspondence", organisationId: "org-larchfield", eventId: "w-e14", documentDate: "2026-09-18", receivedAt: "2026-09-30T10:00:00", availabilityStatus: "Available", sourceRecordId: "src-w-larch",
      syntheticContent: "Mr Quayle is progressing well and walks indoors with a stick. We continue fortnightly sessions." },
  ],
  actions: [
    { id: "a-w-01", patientId: P, title: "Community rehabilitation contact after discharge", plainTitle: "Contact from the community rehabilitation team", description: "Referral sent on discharge. The receiving service has no record of receipt or contact.", status: "No completion recorded", responsibleRoleId: "Community rehabilitation team", responsibleServiceId: "svc-rehab", dueText: "Urgent referral (no date recorded)", sourceEventIds: ["w-e08", "w-e09"], createdAt: "2026-06-16", updatedAt: "2026-06-16" },
    { id: "a-w-02", patientId: P, title: "Rebook falls assessment", plainTitle: "New falls service appointment", description: "Appointment cancelled while an inpatient. No rebooking or responsible role recorded.", status: "Open", sourceEventIds: ["w-e10"], createdAt: "2026-06-05", updatedAt: "2026-06-05" },
    { id: "a-w-03", patientId: P, title: "Fracture clinic review", plainTitle: "Fracture clinic appointment", description: "Booked.", status: "Scheduled", responsibleRoleId: "Orthopaedic team", responsibleServiceId: "svc-ortho", dueAt: "2026-11-24", sourceEventIds: ["w-e15"], createdAt: "2026-07-28", updatedAt: "2026-07-28" },
  ],
  audit: [
    { id: "au-w-01", patientId: P, actorRole: "Integration service", actionType: "Record imported", entityType: "RecordSource", entityId: "src-w-gp", occurredAt: "2026-10-22T11:40:00", description: "GP extract imported." },
    { id: "au-w-02", patientId: P, actorRole: "Integration service", actionType: "Record imported", entityType: "RecordSource", entityId: "src-w-hosp", occurredAt: "2026-10-21T07:30:00", description: "Hospital extract imported." },
    { id: "au-w-03", patientId: P, actorRole: "Rules engine (demo)", actionType: "Reconciliation flagged", entityType: "Referral", entityId: "ref-w-rehab", occurredAt: "2026-07-01T00:00:00", description: "Referral sent with no receipt recorded after 14 days." },
    { id: "au-w-04", patientId: P, actorRole: "GP", actionType: "Record updated", entityType: "MedicationRecord", entityId: "m-w-03", occurredAt: "2026-07-02T14:50:00", description: "Alendronic acid added to repeat prescriptions." },
  ],
  branches: [
    { id: "b-w-main", patientId: P, name: "Main pathway", plainName: "Your journey", lane: 0 },
    { id: "b-w-falls", patientId: P, name: "Falls prevention pathway", plainName: "Falls service", parentBranchId: "b-w-main", lane: -1 },
    { id: "b-w-rehab", patientId: P, name: "Recovery and rehabilitation", plainName: "Recovery", parentBranchId: "b-w-main", lane: 1 },
  ],
  landmarks: [
    { id: "lm-w-01", patientId: P, landmarkType: "viewpoint", title: "GP: dizziness & falls", linkedEventIds: ["w-e01"], trailBranchId: "b-w-main", displayOrder: 1 },
    { id: "lm-w-02", patientId: P, landmarkType: "signpost", title: "Referral: falls service", linkedEventIds: ["w-e02"], linkedReferralId: "ref-w-falls", trailBranchId: "b-w-falls", displayOrder: 2 },
    { id: "lm-w-03", patientId: P, landmarkType: "bridge", title: "Ambulance to hospital", linkedEventIds: ["w-e03", "w-e04", "w-e05"], trailBranchId: "b-w-main", displayOrder: 3 },
    { id: "lm-w-04", patientId: P, landmarkType: "campsite", title: "Hospital stay", linkedEventIds: ["w-e05", "w-e06", "w-e07", "w-e08"], linkedCareEpisodeId: "ep-w-inpt", trailBranchId: "b-w-main", displayOrder: 4, visualVariant: "shelter" },
    { id: "lm-w-05", patientId: P, landmarkType: "marker", title: "Falls appt cancelled", linkedEventIds: ["w-e10"], trailBranchId: "b-w-falls", displayOrder: 5 },
    { id: "lm-w-06", patientId: P, landmarkType: "bridge", title: "Home: rehab referral", description: "Handover from hospital to community rehabilitation.", linkedEventIds: ["w-e08", "w-e09"], linkedReferralId: "ref-w-rehab", trailBranchId: "b-w-rehab", displayOrder: 6 },
    { id: "lm-w-07", patientId: P, landmarkType: "marker", title: "GP medicines review", linkedEventIds: ["w-e11"], trailBranchId: "b-w-main", displayOrder: 7 },
    { id: "lm-w-08", patientId: P, landmarkType: "campsite", title: "Private physiotherapy", linkedEventIds: ["w-e13", "w-e14"], linkedCareEpisodeId: "ep-w-physio", trailBranchId: "b-w-rehab", displayOrder: 8, visualVariant: "private" },
    { id: "lm-w-09", patientId: P, landmarkType: "campsite", title: "Fracture clinic", linkedEventIds: ["w-e12"], linkedCareEpisodeId: "ep-w-ortho", trailBranchId: "b-w-main", displayOrder: 9 },
    { id: "lm-w-10", patientId: P, landmarkType: "viewpoint", title: "Review: 24 Nov", linkedEventIds: ["w-e15"], trailBranchId: "b-w-main", displayOrder: 10 },
  ],
  organisations: [],
  services: [],
};
