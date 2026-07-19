import { Router } from 'express';
import * as rolesController from '../controllers/roles.controller';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get('/roles', authMiddleware, authorize('ADMIN'), rolesController.listRoles);
router.post('/roles', authMiddleware, authorize('ADMIN'), rolesController.createRole);

export default router;
