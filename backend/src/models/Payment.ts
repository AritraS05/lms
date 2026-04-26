import { Schema, model, Document, Types, Model } from 'mongoose';

export interface IPayment extends Document {
  loan: Types.ObjectId;
  utr: string;
  amount: number;
  paidOn: Date;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// UTR — typical Indian payment ref. Allow alphanumeric, 8–30 chars, uppercase normalised.
export const UTR_REGEX = /^[A-Z0-9]{8,30}$/;

const paymentSchema = new Schema<IPayment>(
  {
    loan: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
      index: true,
    },
    utr: {
      type: String,
      required: true,
      unique: true, // global uniqueness across all payments
      uppercase: true,
      trim: true,
      match: UTR_REGEX,
    },
    amount: { type: Number, required: true, min: 1 },
    paidOn: { type: Date, required: true, default: Date.now },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

paymentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as unknown as Record<string, unknown>).__v;
    return ret;
  },
});

export const Payment: Model<IPayment> = model<IPayment>('Payment', paymentSchema);
