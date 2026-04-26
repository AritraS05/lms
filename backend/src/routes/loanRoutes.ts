import { Router } from 'express';
import { applyForLoan, getMyLoans, getMyLoanDetail } from '../controllers/loanController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/me', getMyLoans);
router.get('/:id', getMyLoanDetail);
router.post('/apply', requireRole('Borrower'), applyForLoan);

export default router;
