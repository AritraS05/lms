import { Router } from 'express';
import { listLeads } from '../controllers/salesController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requireRole('Admin', 'Sales'));

router.get('/leads', listLeads);

export default router;
