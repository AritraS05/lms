// Shared types for the operations dashboard.

import type { Loan } from './loan';

export interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
}

export type LoanWithUser = Omit<Loan, 'user'> & {
  user: PopulatedUser | string;
  rejectionReason?: string;
};

export interface Payment {
  _id: string;
  loan: string;
  utr: string;
  amount: number;
  paidOn: string;
  recordedBy: PopulatedUser | string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStage =
  | 'signed-up'
  | 'rejected-bre'
  | 'eligible-no-slip'
  | 'slip-uploaded'
  | 'loan-applied'
  | 'loan-closed';

export interface Lead {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  stage: LeadStage;
  profile: {
    fullName?: string;
    pan?: string;
    monthlySalary?: number;
    employmentMode?: string;
    status?: 'eligible' | 'rejected';
    hasSlip: boolean;
  } | null;
}

export const STAGE_LABEL: Record<LeadStage, string> = {
  'signed-up': 'Signed up',
  'rejected-bre': 'BRE rejected',
  'eligible-no-slip': 'Awaiting salary slip',
  'slip-uploaded': 'Ready to apply',
  'loan-applied': 'Active loan',
  'loan-closed': 'Past borrower',
};

export const ROLE_TO_MODULE: Record<string, string | null> = {
  Sales: '/dashboard/sales',
  Sanction: '/dashboard/sanction',
  Disbursement: '/dashboard/disbursement',
  Collection: '/dashboard/collection',
  Admin: null, // Admin sees all
  Borrower: null, // borrowers don't have ops modules
};

export function userOf(loan: LoanWithUser): PopulatedUser | null {
  return typeof loan.user === 'string' ? null : loan.user;
}
