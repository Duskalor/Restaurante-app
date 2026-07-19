import { Router } from 'express';
import * as branchesController from '../controllers/branches.controller';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get('/branches', authMiddleware, branchesController.listBranches);
router.post('/branches', authMiddleware, authorize('ADMIN'), branchesController.createBranch);

export default router;
