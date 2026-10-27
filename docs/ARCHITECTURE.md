# Architecture and data model

## Shape

```
src/
  types.ts              Typed entities (single source of truth for the model)
  data/                 Synthetic dataset (TypeScript modules, validated by scripts/validate.ts)
  lib/
    repo.ts             Data access: one Repo per patient, indexed lookups, relationship helpers
    dates.ts            Date formatting, the duration convention, DEMO_TODAY
    gaps.ts             Information-gap rules R1–R12 → GapFinding[]
    landmarks.ts        JourneyLandmark → LandmarkVM (status, dates, duration, gaps); landscape filters
    layout.ts           Trail geometry (x by display order, y by branch lane)
    filters.ts          Timeline filters and global search
    summary.ts          Overview derivations (current situation, next steps)
  context.tsx           App state: mode, patient, page (hash route), detail-panel stack, highlight
  components/           Shell, Landscape, Glyphs, DetailPanel, Timeline, common UI
  pages/                Overview + all patient and professional pages
```

The layers are kept apart. Presentation components never compute clinical facts. Dates, durations and statuses come from `lib/`, and `lib/` reads only through `Repo`. Both experience modes use the same `Repo`, findings and landmark view models. Only the wording and the level of detail change between modes.

## Entities

All of the entities in the specification are modelled in `src/types.ts`: Patient, Organisation, Service, HealthcareEvent, Referral, Appointment, MedicationRecord, CareEpisode, TeamInvolvement, Document, ActionItem, RecordSource, AuditEvent and JourneyLandmark. There is also TrailBranch.

Additions beyond the spec, and why:

| Field | Purpose |
|---|---|
| `HealthcareEvent.plainSummary` | Patient-friendly wording, kept next to the professional summary so both views describe the same record |
| `HealthcareEvent.significant` | Drives "significant events only" and milestone filters |
| `HealthcareEvent.metadata.followUpExpected` | Lets rule R4 detect a discharge without follow-up without guessing |
| `Referral.decisionAt`, `statusHistory` | Waiting-for-decision calculation and referral tracing |
| `MedicationRecord.medicationGroup` | Groups records that describe the same medicine across sources (rule R5) |
| `Document.statedEventDate` | The date the document itself states (rule R9 compares it with the event date) |
| `TrailBranch` | Named, laned pathways for branching trails |

## The landmark presentation model

A `JourneyLandmark` stores only presentation data: type, short title, branch, display order and visual variant. It also holds references (`linkedEventIds`, `linkedCareEpisodeId`, `linkedReferralId`). `buildLandmarks()` derives everything clinical from those references:

- **Campsite**: dates, status and duration come from the CareEpisode.
- **Signpost**: sent and decision dates and status come from the Referral. A referral that was only sent never appears as "completed".
- **Bridge**: handover status comes from the linked referral's receipt. If there is no receipt, the label is "Receipt not recorded".
- **Viewpoint / marker**: dates and status come from the linked events.

The **current recorded stage** is the latest landmark that has started on or before `DEMO_TODAY`. The walker is placed there.

## Durations

Durations are elapsed calendar days (end − start), and both dates are always shown. Ongoing periods are measured to `DEMO_TODAY` and labelled "so far". If a date is missing, the period shows "cannot be fully determined" and no number is invented. Appointment lengths (recorded minutes) are labelled separately from time elapsed between events.

## Information-gap rules

The rules are deterministic, documented in the UI (Outstanding Actions → Detection rules) and listed in `RULES` in `lib/gaps.ts`. Each finding records the rule ID, its category ("Information incomplete", "Review recommended" or "Potential coordination issue") and the six required explanations. It also lists the exact records involved and the landmarks it attaches to. There are no scores. The only threshold is R2 (14 days without a recorded receipt), and the UI labels it as a demonstration rule.

## Routing and state

The site root (`/` or `#/`) is a landing page (`src/pages/Home.tsx`) with no patient record open; a record opens only from an explicit route. Record routes are hash-based (`#/{patient|pro}/{patientId}/{page}?lm={landmarkId}`), so the static build works on any host. The detail panel is a stack, so related records can be followed and the Back button returns through them. Esc closes the panel and focus goes back to the element that opened it.

## Validation

`npm run validate` checks:
- unique IDs
- that every foreign key resolves
- that each service belongs to its event's organisation
- that no record ends before it starts
- that ongoing episodes have no end date
- that available documents have content

It then prints every derived finding and landmark status.
