// Pure types, constants, and SI math for the loan flow.
// Safe for both Client and Server components.

export const MIN_PRINCIPAL = 50_000;
export const MAX_PRINCIPAL = 500_000;
export const PRINCIPAL_STEP = 5_000;

export const MIN_TENURE_DAYS = 30;
export const MAX_TENURE_DAYS = 365;
export const TENURE_STEP = 1;

export const INTEREST_RATE_PCT = 12;

export const LOAN_STATUSES = [
  'pending',
  'sanctioned',
  'rejected',
  'disbursed',
  'closed',
] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const ACTIVE_LOAN_STATUSES: readonly LoanStatus[] = [
  'pending',
  'sanctioned',
  'disbursed',
];

export interface Loan {
  _id: string;
  user: string;
  principal: number;
  tenureDays: number;
  interestRatePct: number;
  interestAmount: number;
  totalRepayment: number;
  status: LoanStatus;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** SI = (P × R × T) / (365 × 100), T in days. */
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

/** Indian-format integer rupees: ₹1,23,456. */
export function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** Indian-format with 2 decimals: ₹1,23,456.78. */
export function formatINR2(n: number): string {
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
