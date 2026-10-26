# UX decisions and design system

## The metaphor does work, not decoration

| Landmark | Meaning | Why |
|---|---|---|
| Signpost | Referral or change of direction | A junction is where direction changes. Its status is the referral's status, so a referral that was only sent never looks like an arrival. |
| Campsite (tent; cabin for inpatient stays) | A sustained period with one team | A camp is where you stay a while. The label shows the date range and the calculated duration. |
| Bridge | Handover between services or settings | Bridges make continuity visible. A bridge whose receiving side never recorded receipt is labelled "Receipt not recorded". |
| Viewpoint | Milestone, assessment, review or a booked future step | A place to stop and take stock. |
| Trail marker | A single event (test, GP visit, medicine change, overseas visit) | Small events stay small, so not every event is forced into a large landmark. |
| Walker | The most recent recorded stage | It is static (no animation), sits beside the latest stage, and the legend says plainly that it shows position in the record, not progress or health. |

Parallel care (for example, physical and mental health) shows as separate named trails that fork from a shared start. Future steps use a fainter, dotted trail.

## Status never relies on colour alone

Each status has a distinct ring style, a badge shape and a text label:

- **Completed**: solid ring, ✓
- **Ongoing**: double ring, target dot
- **Upcoming / Booked**: dashed ring, calendar
- **Awaiting update**: long-dash ring, three dots
- **Outcome not recorded**: dotted ring, ?
- **Cancelled**: plain grey ring, ×

Information gaps add a separate yellow triangle badge with "!". Red is reserved for genuine conflicts. Unresolved administrative items use a restrained amber, so they don't look like emergencies.

## Patient view vs professional view

Both views use the same data. The patient view uses plain wording (`plainSummary`, `plainTitle`, for example "Your referral has been received. The specialist team has not yet recorded a decision or an assessment appointment."). It frames gaps as "about the records, not about you" and avoids codes. The professional view adds identifiers, provenance, record IDs, the rule behind each finding, tables and reconciliation. The professional view uses a slightly cooler background, so it's always clear which view is showing.

## Honesty rules built into the interface

- If no appointment is booked, the overview says so directly.
- Recorded actions are labelled "Planned in your records, not yet booked" so they don't read as appointments.
- Documents that are referenced but missing get an explanation instead of a download button.
- Medication pages say they are a record, not advice. Old prescriptions are not treated as current use (the ferrous fumarate note).
- No referral is labelled overdue, because no documented deadline exists.

## Accessibility (target WCAG 2.2 AA)

- The landscape is real buttons in an ordered list, in chronological order. Each button has a full spoken description (type, meaning, title, dates, status, duration, gaps).
- Arrow keys, Home and End move between landmarks.
- A List view and a full timeline offer two complete non-visual alternatives.
- The detail panel is a modal dialog: focus moves to its heading, Tab is trapped inside, Esc closes it and focus returns to the opener.
- There is a skip link, focus moves to the page heading when you change page, focus outlines are visible, touch targets are at least 40px, and reduced-motion preferences are respected.
- The demo switch is a labelled radio group, global search is an ARIA combobox, and filter changes are announced through live regions.
- Measured contrast: main text 12.3:1 on the background, secondary text 5.8:1, amber status text 5.4:1 on its pale fill, white on forest 7.9:1. All status pills are at least 4.9:1.

## Responsive behaviour

- **Desktop:** a wide, horizontally scrollable landscape with scroll buttons and "Current stage" recentring.
- **Tablet:** the same layout, with navigation in a drawer.
- **Mobile (≤760px):** a separate vertical illustrated trail. Branch lanes show as left and right offsets, every landmark is a full-width card, the detail panel goes full-screen, and no horizontal scrolling is needed.

## Design tokens

Defined in `src/styles.css` under `:root`:
- Off-white `#F8FAF5`
- Forest `#285B46`
- Sage `#DCE9D8`
- Mint `#EAF3E8`
- Teal `#287D78` and deep teal `#205B59`
- Sunshine `#F2D77A`, used sparingly for the sun, selection and the current stage
- Earth `#C8B69A` for trails
- Text `#24352D` and secondary text `#56665C` (darkened from the suggested `#5E6E64` for contrast)

Type is Fraunces for display (warm, editorial) and Public Sans for body text (designed for public-service readability).

The logo is a mountain outline with a winding path leading towards a sun. It works at favicon size.
