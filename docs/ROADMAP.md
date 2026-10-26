# Future production roadmap

This prototype deliberately has no back end, no authentication and no real data. A production service would need everything below before any real patient information was involved.

## 1. Governance and safety (before build)
- **Clinical safety:** a DCB0129 clinical risk management system as manufacturer, DCB0160 for deploying organisations, a named Clinical Safety Officer, and a hazard log. Gap findings and "current stage" logic are clinical-adjacent and must be assessed.
- **Data protection:** a DPIA, a lawful basis under UK GDPR (Art. 6 and Art. 9) and a defined controller and processor model. Also the Caldicott principles, national data opt-out handling and records retention.
- **Regulatory:** a medical device classification assessment under UK MDR / MHRA guidance (care-coordination insights may count as software as a medical device), the DTAC, the DSPT, and accessibility statements.
- **Branding:** permission and conformance for any NHS identity use. Until then the product stays clearly independent.

## 2. Identity and access
- NHS login for patients and NHS CIS2 / smartcard-equivalent authentication for staff.
- Role-based and relationship-based access control (legitimate relationship, sealed records, proxy access for carers, under-16 rules).
- Replace the demo view switch with real, audited permissions.

## 3. Interoperability
- FHIR UK Core resources: Patient, Encounter, EpisodeOfCare, ServiceRequest (referrals), Appointment, MedicationStatement / MedicationRequest, DocumentReference, Provenance and AuditEvent. These map closely onto the current model.
- Sources would include GP Connect, the National Record Locator, Shared Care Records, the e-Referral Service, and private and overseas document intake with verification and translation workflows.
- Patient matching, de-duplication and record-linkage confidence, shown to users instead of being merged silently.

## 4. Platform
- A secure API (UK-hosted), encryption at rest and in transit, secrets management, and an immutable audit log.
- Event-driven ingestion with source-level provenance and re-processing.
- The gap rules engine moves server-side, with versioned rules, clinical sign-off and per-organisation thresholds.
- Observability, penetration testing and a vulnerability management process.

## 5. Product
- Research with patients, carers and clinicians, including people with low digital or health literacy, and usability testing against the acceptance tasks in `TESTING.md`.
- Notifications that never imply clinical urgency the system cannot judge.
- Patient-initiated corrections ("this isn't right") routed to the record holder.
- Welsh and other language support, and easy-read content.
- A user-adjustable layout density for the landscape on very long journeys (clustering by year).
