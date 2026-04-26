import path from 'path';
import fs from 'fs';
import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Loan } from '../models/Loan';
import { BorrowerProfile } from '../models/BorrowerProfile';
import { SALARY_SLIP_DIR } from '../utils/uploads';
import { round2 } from '../utils/loan';
import { HttpError } from '../middleware/error';

function loanIdParam(req: Request): string {
  const { id } = req.params;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'Invalid loan id');
  }
  return id;
}

/**
 * Returns everything an ops officer needs to evaluate a loan in one shot:
 * loan + populated user + the borrower profile (with salary slip metadata).
 */
export async function getLoanInspection(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = loanIdParam(req);
    const loan = await Loan.findById(id).populate('user', 'name email');
    if (!loan) throw new HttpError(404, 'Loan not found');

    const profile = await BorrowerProfile.findOne({ user: loan.user });
    const outstanding = round2(loan.totalRepayment - loan.amountPaid);

    res.json({ loan, profile, outstanding });
  } catch (err) {
    next(err);
  }
}

/**
 * Streams the borrower's salary slip back to an authorised ops officer.
 * The Borrower-only download lives at /api/borrower/salary-slip/file; this
 * version looks up the slip via the loan id so officers can verify income
 * before approving / disbursing.
 */
export async function streamLoanSalarySlip(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = loanIdParam(req);
    const loan = await Loan.findById(id);
    if (!loan) throw new HttpError(404, 'Loan not found');

    const profile = await BorrowerProfile.findOne({ user: loan.user });
    if (!profile?.salarySlip) {
      throw new HttpError(404, 'No salary slip on file for this borrower');
    }

    const filePath = path.join(SALARY_SLIP_DIR, profile.salarySlip.filename);
    if (!fs.existsSync(filePath)) {
      throw new HttpError(410, 'File no longer available on disk');
    }

    res.setHeader('Content-Type', profile.salarySlip.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${profile.salarySlip.originalName}"`,
    );
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
}
