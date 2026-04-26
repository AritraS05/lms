import { Router } from 'express';
import {
  listSanctionedLoans,
  disburseLoan,
} from '../controllers/disbursementController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requireRole('Admin', 'Disbursement'));

router.get('/loans', listSanctionedLoans);
router.post('/loans/:id/disburse', disburseLoan);

export default router;
