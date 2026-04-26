/**
 * Loan configuration constants and Simple Interest math.
 * Mirrored on the client for live preview, but the server is authoritative.
 */

export const MIN_PRINCIPAL = 50_000;        // ₹50,000
export const MAX_PRINCIPAL = 500_000;       // ₹5,00,000
export const MIN_TENURE_DAYS = 30;
export const MAX_TENURE_DAYS = 365;
export const INTEREST_RATE_PCT = 12;        // fixed annual %

export const LOAN_STATUSES = [
  'pending',
  'sanctioned',
  'rejected',
  'disbursed',
  'closed',
] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

// Statuses that block a borrower from starting another application.
export const ACTIVE_LOAN_STATUSES: readonly LoanStatus[] = [
  'pending',
  'sanctioned',
  'disbursed',
];

/** SI = (P × R × T) / (365 × 100) where T is in days. */
export function simpleInterest(
  principal: number,
  tenureDays: number,
  ratePct: number = INTEREST_RATE_PCT,
): number {
  return (principal * ratePct * tenureDays) / (365 * 100);
}

export function totalRepayment(
  principal: number,
  tenureDays: number,
  ratePct: number = INTEREST_RATE_PCT,
): number {
  return principal + simpleInterest(principal, tenureDays, ratePct);
}

/** Round to 2 decimal places (paise). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
