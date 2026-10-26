// Pathways — typed data model.
// Every screen reads from these entities via src/lib/repo.ts. Nothing on screen
// should be hardcoded that contradicts the dataset.

export type ISODate = string; // "2026-03-10"
export type ISODateTime = string; // "2026-03-10T10:30:00"

export type Jurisdiction = "England, UK" | "Scotland, UK" | "Wales, UK" | "Spain" | "Ireland" | "Portugal";

export interface Patient {
  id: string;
  displayName: string;
  preferredName?: string;
  dateOfBirth: ISODate;
  pronouns?: string;
  demonstrationIdentifiers: { label: string; value: string }[];
  recordUpdatedAt: ISODateTime;
  linkedRecordSources: string[]; // RecordSource ids
  address?: string;
  phone?: string;
  email?: string;
  gpOrganisationId: string;
  communicationNeeds?: string;
  summaryForPatient: string; // short plain-language framing of the journey
}

export type OrganisationType =
  | "GP practice"
  | "NHS hospital trust"
  | "Community health services"
  | "Ambulance service"
  | "Private provider"
  | "Overseas provider";

export interface Organisation {
  id: string;
  name: string;
  organisationType: OrganisationType;
  jurisdiction: Jurisdiction;
  location: string;
  contactDetails: { phone?: string; email?: string; address?: string; hours?: string };
  sector: "NHS" | "Private" | "Overseas";
}

export interface Service {
  id: string;
  organisationId: string;
  name: string;
  serviceType: string;
  description: string;
  contactDetails?: { phone?: string; email?: string };
}

export type EventType =
  | "GP consultation"
  | "Ambulance attendance"
  | "Emergency department presentation"
  | "Referral"
  | "Triage"
  | "Assessment"
  | "Outpatient appointment"
  | "Medication change"
  | "Diagnostic test"
  | "Procedure"
  | "Review"
  | "Admission"
  | "Ward transfer"
  | "Discharge"
  | "Community contact"
  | "Private consultation"
  | "Overseas consultation"
  | "Follow-up appointment"
  | "Document imported";

export type EventStatus =
  | "Completed"
  | "Scheduled"
  | "Cancelled"
  | "Did not attend"
  | "Outcome not recorded"
  | "Awaiting update";

export interface HealthcareEvent {
  id: string;
  patientId: string;
  eventType: EventType;
  title: string;
  summary: string; // professional summary
  plainSummary?: string; // patient-friendly summary
  occurredAt: ISODate | ISODateTime;
  endedAt?: ISODate | ISODateTime;
  recordedAt: ISODateTime;
  receivedAt?: ISODateTime; // when imported (differs for external records)
  organisationId: string;
  serviceId: string;
  status: EventStatus;
  outcome?: string;
  sourceRecordId: string;
  linkedEventIds: string[];
  relatedReferralIds: string[];
  significant?: boolean;
  metadata?: {
    location?: string;
    responsibleRole?: string;
    reason?: string;
    arrivalMethod?: string;
    dischargeDestination?: string;
    referringServiceId?: string;
    receivingServiceId?: string;
    durationMinutes?: number;
    clinician?: string;
    followUpExpected?: boolean; // discharge events: a follow-up was expected
  };
}

export type ReferralStatus =
  | "Sent"
  | "Received"
  | "Awaiting review"
  | "Accepted"
  | "Declined"
  | "Redirected"
  | "Appointment scheduled"
  | "Assessment completed"
  | "Cancelled"
  | "Closed";

export interface Referral {
  id: string;
  patientId: string;
  referringOrganisationId: string;
  receivingOrganisationId: string;
  referringServiceId: string;
  receivingServiceId: string;
  createdAt: ISODate;
  sentAt?: ISODate;
  receivedAt?: ISODate;
  decisionAt?: ISODate; // triage / acceptance decision
  currentStatus: ReferralStatus;
  reason?: string;
  outcome?: string;
  priority?: "Routine" | "Urgent" | "Two-week wait";
  responsibleRoleId?: string;
  linkedEventIds: string[];
  sourceRecordId: string;
  lastUpdatedAt: ISODateTime;
  statusHistory: { status: ReferralStatus; at: ISODate; note?: string }[];
}

export interface Appointment {
  id: string;
  patientId: string;
  organisationId: string;
  serviceId: string;
  scheduledAt: ISODateTime;
  durationMinutes?: number;
  appointmentType: string;
  status: "Scheduled" | "Attended" | "Cancelled" | "Did not attend" | "Outcome not recorded";
  outcome?: string;
  linkedReferralId?: string;
  location: string;
  followUpEventIds: string[];
  eventId?: string; // the HealthcareEvent representing this appointment
  clinicianRole?: string;
}

export type MedStatus = "Active" | "Stopped" | "Completed course" | "Changed" | "Awaiting reconciliation";

export interface MedicationRecord {
  id: string;
  patientId: string;
  medicationName: string;
  recordedDose: string;
  route: string;
  frequency: string;
  startDate?: ISODate;
  endDate?: ISODate;
  status: MedStatus;
  recordType: "Prescription" | "Discharge medication" | "Hospital administration" | "Overseas prescription" | "Private prescription" | "Patient reported";
  organisationId: string;
  sourceRecordId: string;
  lastUpdatedAt: ISODateTime;
  medicationGroup: string; // groups records that describe the same medicine
  linkedEventIds: string[];
  note?: string;
}

export interface CareEpisode {
  id: string;
  patientId: string;
  title: string;
  plainTitle?: string;
  startDate?: ISODate;
  endDate?: ISODate;
  status: "Completed" | "Ongoing" | "Planned" | "Outcome not recorded";
  relatedEventIds: string[];
  participatingServiceIds: string[];
  episodeKind: "Community" | "Outpatient" | "Inpatient" | "Rehabilitation" | "Private" | "Specialist clinic";
  outcome?: string;
}

export interface TeamInvolvement {
  id: string;
  patientId: string;
  serviceId: string;
  startDate?: ISODate;
  endDate?: ISODate;
  involvementStatus: "Current" | "Historical" | "Referred, not yet involved";
  responsibilityDescription: string;
  roleInJourney: string;
}

export interface Document {
  id: string;
  patientId: string;
  title: string;
  documentType:
    | "Referral letter"
    | "Discharge summary"
    | "Appointment letter"
    | "Assessment report"
    | "Clinical correspondence"
    | "Medication summary"
    | "Overseas record"
    | "Test results";
  organisationId: string;
  eventId?: string;
  documentDate?: ISODate;
  receivedAt?: ISODateTime;
  availabilityStatus: "Available" | "Referenced, not received" | "Partially available";
  syntheticContent?: string; // paragraphs separated by \n\n
  sourceRecordId: string;
  language?: string;
  statedEventDate?: ISODate; // the event date the document itself states
  author?: string;
}

export interface ActionItem {
  id: string;
  patientId: string;
  title: string;
  plainTitle?: string;
  description: string;
  status: "Open" | "Completed" | "No completion recorded" | "Scheduled";
  responsibleRoleId?: string; // free text role, e.g. "GP (Willowmere Medical Practice)"
  responsibleServiceId?: string;
  dueAt?: ISODate;
  dueText?: string; // e.g. "within 3 months" if no exact date
  sourceEventIds: string[];
  completionEventId?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface RecordSource {
  id: string;
  organisationId: string;
  sourceType: "GP clinical system extract" | "Hospital EPR extract" | "Community system extract" | "Ambulance record" | "Private clinic letter" | "Overseas document (patient supplied)" | "Pharmacy record";
  sourceReference: string;
  jurisdiction: Jurisdiction;
  receivedAt: ISODateTime;
  verificationStatus: "Verified" | "Unverified" | "Partially verified";
  lastUpdatedAt: ISODateTime;
  note?: string;
}

export interface AuditEvent {
  id: string;
  patientId: string;
  actorRole: string;
  actionType: "Record imported" | "Record viewed" | "Record updated" | "Reconciliation flagged" | "Document linked" | "Status changed";
  entityType: string;
  entityId: string;
  occurredAt: ISODateTime;
  description: string;
}

export type LandmarkType = "signpost" | "campsite" | "bridge" | "viewpoint" | "marker" | "trailhead";

export interface JourneyLandmark {
  id: string;
  patientId: string;
  landmarkType: LandmarkType;
  title: string; // short label, presentation only
  description?: string; // presentation-only framing; clinical data comes from linked records
  linkedEventIds: string[];
  linkedCareEpisodeId?: string;
  linkedReferralId?: string;
  // dates & status are derived from linked records (see lib/landmarks.ts)
  trailBranchId: string;
  displayOrder: number;
  visualVariant?: "default" | "shelter" | "overseas" | "private";
}

export interface TrailBranch {
  id: string;
  patientId: string;
  name: string;
  plainName: string;
  parentBranchId?: string;
  lane: number; // -1 upper, 0 middle, 1 lower
}

export interface PatientDataset {
  patient: Patient;
  organisations: Organisation[];
  services: Service[];
  events: HealthcareEvent[];
  referrals: Referral[];
  appointments: Appointment[];
  medications: MedicationRecord[];
  episodes: CareEpisode[];
  teams: TeamInvolvement[];
  documents: Document[];
  actions: ActionItem[];
  sources: RecordSource[];
  audit: AuditEvent[];
  landmarks: JourneyLandmark[];
  branches: TrailBranch[];
}
