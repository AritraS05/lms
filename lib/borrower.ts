// Pure types & constants for the borrower flow.
// Safe to import from both Client and Server components.

export const EMPLOYMENT_MODES = [
  'Salaried',
  'Self-Employed',
  'Unemployed',
] as const;
export type EmploymentMode = (typeof EMPLOYMENT_MODES)[number];

export interface BreFailure {
  rule: 'age' | 'salary' | 'pan' | 'employment';
  message: string;
}

export interface SalarySlip {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface BorrowerProfile {
  _id: string;
  user: string;
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  status: 'eligible' | 'rejected';
  rejectionReasons: BreFailure[];
  salarySlip?: SalarySlip;
  createdAt: string;
  updatedAt: string;
}

// Step 3 — salary slip constraints (mirror of backend).
export const MAX_SALARY_SLIP_BYTES = 5 * 1024 * 1024;
export const ALLOWED_SLIP_MIMETYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;
export const ALLOWED_SLIP_EXTENSIONS = '.pdf,.jpg,.jpeg,.png';
