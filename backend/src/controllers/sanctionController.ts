import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Loan } from '../models/Loan';
import { HttpError } from '../middleware/error';

export async function listPendingLoans(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const loans = await Loan.find({ status: 'pending' })
      .populate('user', 'name email role')
      .sort({ appliedAt: 1 });
    res.json({ loans });
  } catch (err) {
    next(err);
  }
}

function loanIdParam(req: Request): string {
  const { id } = req.params;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'Invalid loan id');
  }
  return id;
}

export async function approveLoan(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    const id = loanIdParam(req);
    const loan = await Loan.findById(id);
    if (!loan) throw new HttpError(404, 'Loan not found');
    if (loan.status !== 'pending') {
      throw new HttpError(
        409,
        `Cannot approve a loan in '${loan.status}' state`,
      );
    }
    loan.status = 'sanctioned';
    loan.sanctionedAt = new Date();
    loan.sanctionedBy = new Types.ObjectId(req.user.sub);
    await loan.save();
    res.json({ loan });
  } catch (err) {
    next(err);
  }
}

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Rejection reason must be at least 3 characters')
    .max(500),
});

export async function rejectLoan(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    const id = loanIdParam(req);
    const { reason } = rejectSchema.parse(req.body);
    const loan = await Loan.findById(id);
    if (!loan) throw new HttpError(404, 'Loan not found');
    if (loan.status !== 'pending') {
      throw new HttpError(
        409,
        `Cannot reject a loan in '${loan.status}' state`,
      );
    }
    loan.status = 'rejected';
    loan.rejectedAt = new Date();
    loan.rejectedBy = new Types.ObjectId(req.user.sub);
    loan.rejectionReason = reason;
    await loan.save();
    res.json({ loan });
  } catch (err) {
    next(err);
  }
}
