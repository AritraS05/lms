import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import {
  submitPersonalDetails,
  getMyBorrowerProfile,
  uploadSalarySlip,
  downloadSalarySlip,
} from '../controllers/borrowerController';
import { requireAuth, requireRole } from '../middleware/auth';
import { salarySlipUpload, MAX_SALARY_SLIP_BYTES } from '../utils/uploads';

const router = Router();

router.use(requireAuth);

router.get('/me', getMyBorrowerProfile);
router.post(
  '/personal-details',
  requireRole('Borrower'),
  submitPersonalDetails,
);

// Wrap multer so we can convert its errors into JSON responses with sane status codes.
function uploadMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  salarySlipUpload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const mb = (MAX_SALARY_SLIP_BYTES / (1024 * 1024)).toFixed(0);
        res.status(413).json({ message: `File too large (max ${mb} MB)` });
        return;
      }
      res.status(400).json({ message: err.message });
      return;
    }
    res.status(400).json({ message: (err as Error).message });
  });
}

router.post(
  '/salary-slip',
  requireRole('Borrower'),
  uploadMiddleware,
  uploadSalarySlip,
);
router.get(
  '/salary-slip/file',
  requireRole('Borrower'),
  downloadSalarySlip,
);

export default router;
