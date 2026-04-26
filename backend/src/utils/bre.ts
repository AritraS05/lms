/**
 * Business Rule Engine for borrower eligibility.
 *
 * Lives on the SERVER (single source of truth). The client may mirror the
 * cheapest checks for UX, but the authoritative decision is always made here.
 */

// PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const MIN_SALARY = 25000;
export const MIN_AGE = 23;
export const MAX_AGE = 50;

export const EMPLOYMENT_MODES = [
  'Salaried',
  'Self-Employed',
  'Unemployed',
] as const;
export type EmploymentMode = (typeof EMPLOYMENT_MODES)[number];

export type BreRule = 'age' | 'salary' | 'pan' | 'employment';

export interface BreFailure {
  rule: BreRule;
  message: string;
}

export interface BreInput {
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export function calculateAge(dob: Date, today: Date = new Date()): number {
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function runBRE(input: BreInput): BreFailure[] {
  const failures: BreFailure[] = [];

  const age = calculateAge(input.dob);
  if (age < MIN_AGE || age > MAX_AGE) {
    failures.push({
      rule: 'age',
      message: `Age must be between ${MIN_AGE} and ${MAX_AGE} (you are ${age}).`,
    });
  }

  if (
    !Number.isFinite(input.monthlySalary) ||
    input.monthlySalary < MIN_SALARY
  ) {
    failures.push({
      rule: 'salary',
      message: `Monthly salary must be at least \u20B9${MIN_SALARY.toLocaleString(
        'en-IN',
      )}.`,
    });
  }

  if (!PAN_REGEX.test(input.pan)) {
    failures.push({
      rule: 'pan',
      message:
        'PAN does not match the valid format (5 letters, 4 digits, 1 letter — e.g. ABCDE1234F).',
    });
  }

  if (input.employmentMode === 'Unemployed') {
    failures.push({
      rule: 'employment',
      message: 'Applicant is unemployed.',
    });
  }

  return failures;
}
