import path from 'path';
import fs from 'fs';
import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';

export const SALARY_SLIP_DIR = path.join(
  process.cwd(),
  'uploads',
  'salary-slips',
);

// Ensure the directory exists at boot.
fs.mkdirSync(SALARY_SLIP_DIR, { recursive: true });

export const MAX_SALARY_SLIP_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_SLIP_MIMETYPES = new Set<string>([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

const EXTENSION_BY_MIMETYPE: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, SALARY_SLIP_DIR);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.sub ?? 'anon';
    const ext = EXTENSION_BY_MIMETYPE[file.mimetype] ?? '';
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (!ALLOWED_SLIP_MIMETYPES.has(file.mimetype)) {
    cb(new Error('Only PDF, JPG, and PNG files are allowed'));
    return;
  }
  cb(null, true);
};

export const salarySlipUpload = multer({
  storage,
  limits: { fileSize: MAX_SALARY_SLIP_BYTES, files: 1 },
  fileFilter,
});
