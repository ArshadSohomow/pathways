// Date and duration rules. All durations are calculated from recorded dates — never typed in.
//
// Convention (shown in the UI): durations are ELAPSED CALENDAR DAYS between the start date and
// the end date (end − start). Both dates are always displayed alongside the figure.
// Ongoing episodes are measured up to DEMO_TODAY and labelled "so far". Missing dates produce an
// explicit "cannot be fully determined" state — no duration is invented.

/** The fixed "current date" the demonstration uses, so the synthetic journey stays coherent. */
export const DEMO_TODAY = "2026-10-26";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const datePart = (d: string): string => d.slice(0, 10);
export const hasTime = (d?: string): boolean => !!d && d.length > 10 && d.slice(11, 16) !== "00:00";

/** Day number since epoch for a YYYY-MM-DD string (timezone independent). */
export function dayNumber(d: string): number {
  const [y, m, day] = datePart(d).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, day) / 86400000);
}

export function daysBetween(start: string, end: string): number {
  return dayNumber(end) - dayNumber(start);
}

export function compareDates(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

export const isPast = (d: string): boolean => datePart(d) < DEMO_TODAY;
export const isFuture = (d: string): boolean => datePart(d) > DEMO_TODAY;

export function fmtDate(d?: string, opts: { long?: boolean; weekday?: boolean } = {}): string {
  if (!d) return "Not recorded";
  const [y, m, day] = datePart(d).split("-").map(Number);
  const month = opts.long ? MONTHS_LONG[m - 1] : MONTHS[m - 1];
  let s = `${day} ${month} ${y}`;
  if (opts.weekday) {
    const wd = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
    s = `${DAYS[wd]} ${s}`;
  }
  return s;
}

export function fmtTime(d?: string): string {
  if (!d || !hasTime(d)) return "";
  return d.slice(11, 16);
}

export function fmtDateTime(d?: string, opts: { long?: boolean; weekday?: boolean } = {}): string {
  if (!d) return "Not recorded";
  const t = fmtTime(d);
  return t ? `${fmtDate(d, opts)}, ${t}` : fmtDate(d, opts);
}

export function fmtMonthYear(d: string): string {
  const [y, m] = datePart(d).split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function ageOn(dob: string, on: string = DEMO_TODAY): number {
  const [y1, m1, d1] = dob.split("-").map(Number);
  const [y2, m2, d2] = datePart(on).split("-").map(Number);
  let age = y2 - y1;
  if (m2 < m1 || (m2 === m1 && d2 < d1)) age--;
  return age;
}

export function fmtDays(days: number): string {
  if (days === 0) return "Same day";
  if (days === 1) return "1 day";
  if (days < 21) return `${days} days`;
  const weeks = Math.floor(days / 7);
  const rem = days % 7;
  return `${days} days (${weeks} week${weeks === 1 ? "" : "s"}${rem ? ` ${rem} day${rem === 1 ? "" : "s"}` : ""})`;
}

export function relativeDays(d: string): string {
  const n = daysBetween(DEMO_TODAY, d);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n > 0) return `in ${n} days`;
  return `${-n} days ago`;
}

export type DurationResult =
  | { kind: "complete"; days: number; label: string; detail: string }
  | { kind: "ongoing"; days: number; label: string; detail: string }
  | { kind: "single"; label: string; detail: string }
  | { kind: "unknown"; label: string; detail: string };

/**
 * Duration of a period of care or a wait.
 * @param ongoing  true when the record states the period is still open (measured to DEMO_TODAY).
 */
export function calcDuration(start?: string, end?: string, ongoing = false): DurationResult {
  if (!start && ongoing) {
    return { kind: "unknown", label: "Ongoing — duration cannot be determined", detail: "The record shows this care is ongoing, but its start date is not recorded, so no duration is calculated." };
  }
  if (!start && !end) {
    return { kind: "unknown", label: "Duration cannot be determined", detail: "Neither a start nor an end date is recorded." };
  }
  if (!start) {
    return { kind: "unknown", label: "Duration cannot be fully determined", detail: `The start date is not recorded. ${end ? `End date: ${fmtDate(end)}.` : ""}`.trim() };
  }
  if (ongoing) {
    const days = daysBetween(start, DEMO_TODAY);
    return { kind: "ongoing", days, label: `Ongoing — ${fmtDays(days)} so far`, detail: `Elapsed calendar days from ${fmtDate(start)} to the demonstration date (${fmtDate(DEMO_TODAY)}). No end date is recorded.` };
  }
  if (!end) {
    return { kind: "unknown", label: "Duration cannot be fully determined", detail: `Started ${fmtDate(start)}. No end date is recorded and the record does not say the period is ongoing.` };
  }
  const days = daysBetween(start, end);
  if (days < 0) {
    return { kind: "unknown", label: "Dates conflict", detail: `The recorded end date (${fmtDate(end)}) is before the start date (${fmtDate(start)}).` };
  }
  return { kind: "complete", days, label: fmtDays(days), detail: `Elapsed calendar days from ${fmtDate(start)} to ${fmtDate(end)}.` };
}

export const DURATION_CONVENTION =
  "Durations are elapsed calendar days between the recorded start and end dates (end date minus start date). Ongoing periods are measured to the demonstration date, 26 October 2026. Where a date is missing, no duration is shown.";
