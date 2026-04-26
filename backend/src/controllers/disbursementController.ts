import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Loan } from '../models/Loan';
import { HttpError } from '../middleware/error';

export async function listSanctionedLoans(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const loans = await Loan.find({ status: 'sanctioned' })
      .populate('user', 'name email')
      .sort({ sanctionedAt: 1 });
    res.json({ loans });
  } catch (err) {
    next(err);
  }
}

export async function disburseLoan(
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
    const loan = await Loan.findById(id);
    if (!loan) throw new HttpError(404, 'Loan not found');
    if (loan.status !== 'sanctioned') {
      throw new HttpError(
        409,
        `Only sanctioned loans can be disbursed (current: ${loan.status})`,
      );
    }
    loan.status = 'disbursed';
    loan.disbursedAt = new Date();
    loan.disbursedBy = new Types.ObjectId(req.user.sub);
    await loan.save();
    res.json({ loan });
  } catch (err) {
    next(err);
  }
}
