import { Router } from 'express';
import {
  listDisbursedLoans,
  getLoanWithPayments,
  recordPayment,
} from '../controllers/collectionController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requireRole('Admin', 'Collection'));

router.get('/loans', listDisbursedLoans);
router.get('/loans/:id', getLoanWithPayments);
router.post('/loans/:id/payments', recordPayment);

export default router;
