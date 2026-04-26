import { Router } from 'express';
import {
  getLoanInspection,
  streamLoanSalarySlip,
} from '../controllers/opsLoanController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
// Any non-borrower ops role can inspect loans they're processing.
router.use(requireRole('Admin', 'Sanction', 'Disbursement', 'Collection'));

router.get('/loans/:id', getLoanInspection);
router.get('/loans/:id/salary-slip', streamLoanSalarySlip);

export default router;
