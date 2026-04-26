import { Router } from 'express';
import {
  listPendingLoans,
  approveLoan,
  rejectLoan,
} from '../controllers/sanctionController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requireRole('Admin', 'Sanction'));

router.get('/loans', listPendingLoans);
router.post('/loans/:id/approve', approveLoan);
router.post('/loans/:id/reject', rejectLoan);

export default router;
