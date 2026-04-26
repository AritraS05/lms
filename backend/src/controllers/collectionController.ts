import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Loan } from '../models/Loan';
import { Payment, UTR_REGEX } from '../models/Payment';
import { HttpError } from '../middleware/error';
import { round2 } from '../utils/loan';

export async function listDisbursedLoans(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const loans = await Loan.find({ status: { $in: ['disbursed', 'closed'] } })
      .populate('user', 'name email')
      .sort({ disbursedAt: -1 });
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

export async function getLoanWithPayments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = loanIdParam(req);
    const loan = await Loan.findById(id).populate('user', 'name email');
    if (!loan) throw new HttpError(404, 'Loan not found');

    const payments = await Payment.find({ loan: loan._id })
      .populate('recordedBy', 'name email')
      .sort({ paidOn: -1 });

    const outstanding = round2(loan.totalRepayment - loan.amountPaid);
    res.json({ loan, payments, outstanding });
  } catch (err) {
    next(err);
  }
}

const recordPaymentSchema = z.object({
  utr: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      UTR_REGEX,
      'UTR must be 8–30 alphanumeric characters (uppercase letters and digits)',
    ),
  amount: z.coerce
    .number()
    .positive('Payment amount must be greater than zero'),
  paidOn: z
    .string()
    .refine((v) => !Number.isNaN(new Date(v).getTime()), {
      message: 'Invalid payment date',
    }),
});

export async function recordPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    const id = loanIdParam(req);
    const data = recordPaymentSchema.parse(req.body);

    const loan = await Loan.findById(id);
    if (!loan) throw new HttpError(404, 'Loan not found');
    if (loan.status !== 'disbursed') {
      throw new HttpError(
        409,
        `Only disbursed loans can accept payments (current: ${loan.status})`,
      );
    }

    const outstanding = round2(loan.totalRepayment - loan.amountPaid);
    if (data.amount > outstanding) {
      throw new HttpError(
        400,
        `Payment exceeds outstanding balance of ₹${outstanding.toLocaleString('en-IN')}`,
      );
    }

    // UTR uniqueness — check first for a clean error rather than a Mongo dup-key.
    const existing = await Payment.findOne({ utr: data.utr });
    if (existing) {
      throw new HttpError(409, 'UTR has already been recorded');
    }

    const payment = await Payment.create({
      loan: loan._id,
      utr: data.utr,
      amount: data.amount,
      paidOn: new Date(data.paidOn),
      recordedBy: new Types.ObjectId(req.user.sub),
    });

    loan.amountPaid = round2(loan.amountPaid + data.amount);
    if (loan.amountPaid >= loan.totalRepayment) {
      loan.status = 'closed';
      loan.closedAt = new Date();
    }
    await loan.save();

    res.status(201).json({
      payment,
      loan,
      outstanding: round2(loan.totalRepayment - loan.amountPaid),
    });
  } catch (err) {
    // Re-surface Mongo dup-key as a friendlier 409.
    if (
      typeof err === 'object' &&
      err !== null &&
      (err as { code?: number }).code === 11000
    ) {
      next(new HttpError(409, 'UTR has already been recorded'));
      return;
    }
    next(err);
  }
}
