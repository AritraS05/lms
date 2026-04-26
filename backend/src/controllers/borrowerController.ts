import path from 'path';
import fs from 'fs';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BorrowerProfile } from '../models/BorrowerProfile';
import {
  EMPLOYMENT_MODES,
  PAN_REGEX,
  runBRE,
  type EmploymentMode,
} from '../utils/bre';
import { SALARY_SLIP_DIR } from '../utils/uploads';
import { HttpError } from '../middleware/error';

const personalDetailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(120),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(PAN_REGEX, 'PAN must be 5 letters, 4 digits, then 1 letter'),
  dob: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), {
    message: 'Invalid date of birth',
  }),
  monthlySalary: z.coerce
    .number({ invalid_type_error: 'Monthly salary must be a number' })
    .int('Monthly salary must be a whole number')
    .nonnegative('Monthly salary cannot be negative'),
  employmentMode: z.enum(
    EMPLOYMENT_MODES as readonly [EmploymentMode, ...EmploymentMode[]],
  ),
});

function ensureBorrower(req: Request): asserts req is Request & {
  user: NonNullable<Request['user']>;
} {
  if (!req.user) {
    throw new HttpError(401, 'Not authenticated');
  }
  if (req.user.role !== 'Borrower') {
    throw new HttpError(403, 'Only borrowers can submit personal details');
  }
}

export async function submitPersonalDetails(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    ensureBorrower(req);

    // Once eligible, the profile is locked.
    const existing = await BorrowerProfile.findOne({ user: req.user.sub });
    if (existing && existing.status === 'eligible') {
      throw new HttpError(409, 'Application already approved');
    }

    const data = personalDetailsSchema.parse(req.body);
    const dob = new Date(data.dob);

    // Authoritative BRE pass.
    const failures = runBRE({
      pan: data.pan,
      dob,
      monthlySalary: data.monthlySalary,
      employmentMode: data.employmentMode,
    });
    const status: 'eligible' | 'rejected' =
      failures.length === 0 ? 'eligible' : 'rejected';

    const profile = await BorrowerProfile.findOneAndUpdate(
      { user: req.user.sub },
      {
        user: req.user.sub,
        fullName: data.fullName,
        pan: data.pan,
        dob,
        monthlySalary: data.monthlySalary,
        employmentMode: data.employmentMode,
        status,
        rejectionReasons: failures,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (status === 'rejected') {
      res.status(422).json({
        message: 'Application rejected by the Business Rule Engine',
        status,
        failures,
        profile,
      });
      return;
    }

    res.status(201).json({ status, profile });
  } catch (err) {
    next(err);
  }
}

export async function getMyBorrowerProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    const profile = await BorrowerProfile.findOne({ user: req.user.sub });
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

export async function uploadSalarySlip(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    ensureBorrower(req);

    if (!req.file) {
      throw new HttpError(400, 'No file uploaded (field name must be "file")');
    }

    const profile = await BorrowerProfile.findOne({ user: req.user.sub });
    if (!profile) {
      // Drop the file we just wrote — orphaned with no profile to attach to.
      fs.unlink(req.file.path, () => {});
      throw new HttpError(409, 'Submit personal details before uploading');
    }
    if (profile.status !== 'eligible') {
      fs.unlink(req.file.path, () => {});
      throw new HttpError(403, 'Application is not eligible');
    }

    // Replace any prior slip on disk.
    if (profile.salarySlip) {
      const prior = path.join(SALARY_SLIP_DIR, profile.salarySlip.filename);
      fs.unlink(prior, () => {});
    }

    profile.salarySlip = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };
    await profile.save();

    res.status(201).json({ profile, salarySlip: profile.salarySlip });
  } catch (err) {
    next(err);
  }
}

export async function downloadSalarySlip(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    const profile = await BorrowerProfile.findOne({ user: req.user.sub });
    if (!profile?.salarySlip) {
      throw new HttpError(404, 'No salary slip on file');
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
