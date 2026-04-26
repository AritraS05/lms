import { Schema, model, Document, Types, Model } from 'mongoose';
import {
  EMPLOYMENT_MODES,
  type EmploymentMode,
  type BreFailure,
} from '../utils/bre';

export type BorrowerStatus = 'eligible' | 'rejected';

export interface ISalarySlip {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface IBorrowerProfile extends Document {
  user: Types.ObjectId;
  fullName: string;
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  status: BorrowerStatus;
  rejectionReasons: BreFailure[];
  salarySlip?: ISalarySlip;
  createdAt: Date;
  updatedAt: Date;
}

const rejectionReasonSchema = new Schema<BreFailure>(
  {
    rule: {
      type: String,
      enum: ['age', 'salary', 'pan', 'employment'],
      required: true,
    },
    message: { type: String, required: true },
  },
  { _id: false },
);

const salarySlipSchema = new Schema<ISalarySlip>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const borrowerProfileSchema = new Schema<IBorrowerProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dob: { type: Date, required: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    employmentMode: {
      type: String,
      enum: EMPLOYMENT_MODES,
      required: true,
    },
    status: {
      type: String,
      enum: ['eligible', 'rejected'],
      required: true,
    },
    rejectionReasons: { type: [rejectionReasonSchema], default: [] },
    salarySlip: { type: salarySlipSchema, default: undefined },
  },
  { timestamps: true },
);

borrowerProfileSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as unknown as Record<string, unknown>).__v;
    return ret;
  },
});

export const BorrowerProfile: Model<IBorrowerProfile> = model<IBorrowerProfile>(
  'BorrowerProfile',
  borrowerProfileSchema,
);
