/**
 * Deterministic date formatters with explicit locale + timezone
 * to avoid SSR / client hydration mismatches.
 */

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

/** e.g. "26/04/2026" */
export function fmtDate(d: string | Date): string {
  return dateFmt.format(new Date(d));
}

/** e.g. "26/04/2026, 6:35:47 pm" */
export function fmtDateTime(d: string | Date): string {
  return dateTimeFmt.format(new Date(d));
}
