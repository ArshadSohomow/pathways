# Testing

## Automated

| Command | What it checks |
|---|---|
| `npm run validate` | Referential integrity of all three synthetic patients: unique IDs, every foreign key, each service belonging to its organisation, no record ending before it starts, no end date on an ongoing episode, content present for available documents. It also prints every derived finding and landmark status. |
| `npm run typecheck` | Strict TypeScript |
| `node scripts/acceptance.cjs http://localhost:4173` | Headless Chromium run of the spec's acceptance tasks (below) against a built copy served locally |

## Acceptance tasks (from the specification)

Last run against the production build: **27 / 27 passed**.

**Patient tasks**

1. **P1** Current recorded stage: the overview names "Referral: joint specialists (Awaiting review)".
2. **P2** Latest significant event: "Referral received by Rheumatology", 12 Oct 2026.
3. **P3** Signpost → referral: sent, received and decision dates, plus a 28-day wait for decision.
4. **P4** Campsite → period and duration: hospital stay 7–15 Jul 2026, 8 days.
5. **P5** Next confirmed appointment: Gastroenterology, Wed 4 Nov 2026, 10:30.
6. **P6** Missing information: plain-language "What isn't known yet" list.
7. **P7** Medication status: Azathioprine 100 mg, Awaiting reconciliation, with full history.
8. **P8** Overseas event and source: found through global search. The details show the event date (18 Jun) and the import date (11 Aug), and the source is marked unverified.
9. **P9** Landscape to list: all 20 landmarks are listed. The timeline below lists all 36 events.
10. **P10** Keyboard only: arrow keys move between landmarks, Enter opens the dialog, and Esc returns focus to the landmark.

**Professional tasks**

1. **C1** Cross-provider reconstruction: 36 events from 6 organisations, in event-date order.
2. **C2** Referral trace: status history, linked events and appointments, and a link to its signpost.
3. **C3** Appointment with no outcome: the Encounters filter isolates the 2 Sep 2026 clinic.
4. **C4** Missing discharge follow-up: Walter's rehab handover raises rules R4 and R2.
5. **C5** Medication discrepancy: 50 mg (GP) and 100 mg (hospital) side by side, with their sources.
6. **C6** Record source: provenance table with jurisdiction and verification status.
7. **C7** Service involvement duration: involvement chart plus a duration on each service card.
8. **C8** Filter by service and date: Gastroenterology outpatients from 1 Apr 2026 gives 4 of 36 events.
9. **C9** Referral → assessment → colonoscopy links followed inside the panel stack.
10. **C10** Every finding states that incomplete documentation does not prove that care was not provided.

**Functional checks**

- Ongoing episodes show no invented end date ("230 days so far").
- A missing start date gives "duration cannot be determined".
- Landscape filters, the empty state and reset all work.
- The mode switch keeps the same 10 landmarks.
- 48 page renders across all patients and both modes produce 0 runtime errors.
- All 37 landmarks open a detail panel.

**Mobile (375px)**

- Vertical trail with 20 cards.
- No horizontal page scroll.
- The detail panel opens full-screen.

## Manual review

- Screenshots were reviewed at 1440, 1366, 1280 and 390/375px widths.
- Contrast ratios were calculated for every text and status-pill colour pair (all ≥ 4.9:1; see UX-AND-DESIGN.md).
- Not done: screen-reader testing with real assistive technology (VoiceOver or NVDA), and an automated axe audit. Both are recommended before any user research.
