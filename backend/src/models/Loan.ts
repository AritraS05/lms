import { Schema, model, Document, Types, Model } from 'mongoose';
import {
  LOAN_STATUSES,
  MAX_PRINCIPAL,
  MAX_TENURE_DAYS,
  MIN_PRINCIPAL,
  MIN_TENURE_DAYS,
  type LoanStatus,
} from '../utils/loan';

export interface ILoan extends Document {
  user: Types.ObjectId;
  principal: number;
  tenureDays: number;
  interestRatePct: number;
  interestAmount: number;
  totalRepayment: number;
  amountPaid: number;
  status: LoanStatus;
  appliedAt: Date;
  // Audit trail for ops actions.
  sanctionedAt?: Date;
  sanctionedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectionReason?: string;
  disbursedAt?: Date;
  disbursedBy?: Types.ObjectId;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    principal: {
      type: Number,
      required: true,
      min: MIN_PRINCIPAL,
      max: MAX_PRINCIPAL,
    },
    tenureDays: {
      type: Number,
      required: true,
      min: MIN_TENURE_DAYS,
      max: MAX_TENURE_DAYS,
    },
    interestRatePct: { type: Number, required: true },
    interestAmount: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    amountPaid: { type: Number, required: true, default: 0, min: 0 },
    status: {
      type: String,
      enum: LOAN_STATUSES,
      required: true,
      default: 'pending',
      index: true,
    },
    appliedAt: { type: Date, required: true, default: Date.now },
    sanctionedAt: { type: Date },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, maxlength: 500 },
    disbursedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date },
  },
  { timestamps: true },
);

loanSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as unknown as Record<string, unknown>).__v;
    return ret;
  },
});

export const Loan: Model<ILoan> = model<ILoan>('Loan', loanSchema);
