// Centralised API config used by both client and server components.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

export const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME ?? 'lms_token';

export const ROLES = [
  'Admin',
  'Sales',
  'Sanction',
  'Disbursement',
  'Collection',
  'Borrower',
] as const;

export type Role = (typeof ROLES)[number];

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}
