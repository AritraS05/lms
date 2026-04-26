import type { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { BorrowerProfile } from '../models/BorrowerProfile';
import { Loan } from '../models/Loan';
import { ACTIVE_LOAN_STATUSES } from '../utils/loan';

export type LeadStage =
  | 'signed-up'         // user exists, no profile yet
  | 'rejected-bre'      // profile saved, BRE rejected
  | 'eligible-no-slip'  // eligible profile, no salary slip
  | 'slip-uploaded'     // slip on file, no loan yet
  | 'loan-applied'      // any active loan exists
  | 'loan-closed';      // only closed/rejected loans

interface Lead {
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

export async function listLeads(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const borrowers = await User.find({ role: 'Borrower' }).sort({
      createdAt: -1,
    });
    const userIds = borrowers.map((b) => b._id);

    const profiles = await BorrowerProfile.find({ user: { $in: userIds } });
    const profileByUser = new Map(
      profiles.map((p) => [String(p.user), p]),
    );

    const loans = await Loan.find({ user: { $in: userIds } });
    const loansByUser = new Map<string, typeof loans>();
    for (const l of loans) {
      const k = String(l.user);
      const arr = loansByUser.get(k) ?? [];
      arr.push(l);
      loansByUser.set(k, arr);
    }

    const leads: Lead[] = borrowers.map((u) => {
      const profile = profileByUser.get(String(u._id));
      const userLoans = loansByUser.get(String(u._id)) ?? [];
      const hasActive = userLoans.some((l) =>
        ACTIVE_LOAN_STATUSES.includes(l.status),
      );
      const hasAny = userLoans.length > 0;

      let stage: LeadStage = 'signed-up';
      if (!profile) stage = 'signed-up';
      else if (profile.status === 'rejected') stage = 'rejected-bre';
      else if (!profile.salarySlip) stage = 'eligible-no-slip';
      else if (hasActive) stage = 'loan-applied';
      else if (hasAny) stage = 'loan-closed';
      else stage = 'slip-uploaded';

      return {
        _id: String(u._id),
        name: u.name,
        email: u.email,
        createdAt: u.createdAt.toISOString(),
        stage,
        profile: profile
          ? {
              fullName: profile.fullName,
              pan: profile.pan,
              monthlySalary: profile.monthlySalary,
              employmentMode: profile.employmentMode,
              status: profile.status,
              hasSlip: Boolean(profile.salarySlip),
            }
          : null,
      };
    });

    res.json({ leads });
  } catch (err) {
    next(err);
  }
}
