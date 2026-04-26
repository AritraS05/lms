import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Loan } from '../models/Loan';
import { Payment } from '../models/Payment';
import { BorrowerProfile } from '../models/BorrowerProfile';
import {
  ACTIVE_LOAN_STATUSES,
  INTEREST_RATE_PCT,
  MAX_PRINCIPAL,
  MAX_TENURE_DAYS,
  MIN_PRINCIPAL,
  MIN_TENURE_DAYS,
  round2,
  simpleInterest,
} from '../utils/loan';
import { HttpError } from '../middleware/error';

const applySchema = z.object({
  principal: z.coerce
    .number()
    .int('Principal must be a whole number of rupees')
    .min(MIN_PRINCIPAL, `Minimum loan amount is ₹${MIN_PRINCIPAL}`)
    .max(MAX_PRINCIPAL, `Maximum loan amount is ₹${MAX_PRINCIPAL}`),
  tenureDays: z.coerce
    .number()
    .int('Tenure must be a whole number of days')
    .min(MIN_TENURE_DAYS, `Minimum tenure is ${MIN_TENURE_DAYS} days`)
    .max(MAX_TENURE_DAYS, `Maximum tenure is ${MAX_TENURE_DAYS} days`),
});

export async function applyForLoan(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    if (req.user.role !== 'Borrower') {
      throw new HttpError(403, 'Only borrowers can apply for loans');
    }

    const profile = await BorrowerProfile.findOne({ user: req.user.sub });
    if (!profile) {
      throw new HttpError(409, 'Submit personal details before applying');
    }
    if (profile.status !== 'eligible') {
      throw new HttpError(403, 'Application is not eligible');
    }
    if (!profile.salarySlip) {
      throw new HttpError(409, 'Upload your salary slip before applying');
    }

    const active = await Loan.findOne({
      user: req.user.sub,
      status: { $in: ACTIVE_LOAN_STATUSES },
    });
    if (active) {
      throw new HttpError(
        409,
        'You already have an active loan application. Wait for it to be processed before applying again.',
      );
    }

    const data = applySchema.parse(req.body);
    const interest = round2(simpleInterest(data.principal, data.tenureDays));
    const total = round2(data.principal + interest);

    const loan = await Loan.create({
      user: req.user.sub,
      principal: data.principal,
      tenureDays: data.tenureDays,
      interestRatePct: INTEREST_RATE_PCT,
      interestAmount: interest,
      totalRepayment: total,
      status: 'pending',
      appliedAt: new Date(),
    });

    res.status(201).json({ loan });
  } catch (err) {
    next(err);
  }
}

export async function getMyLoans(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    const loans = await Loan.find({ user: req.user.sub }).sort({
      appliedAt: -1,
    });
    res.json({ loans });
  } catch (err) {
    next(err);
  }
}

export async function getMyLoanDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    
    const { id } = req.params;
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid loan id');
    }

    const loan = await Loan.findOne({ _id: id, user: req.user.sub });
    if (!loan) throw new HttpError(404, 'Loan not found');

    const payments = await Payment.find({ loan: loan._id })
      .sort({ paidOn: -1 })
      // Select fields safe to show the borrower
      .select('utr amount paidOn createdAt');

    const outstanding = round2(loan.totalRepayment - loan.amountPaid);
    
    res.json({ loan, payments, outstanding });
  } catch (err) {
    next(err);
  }
}
