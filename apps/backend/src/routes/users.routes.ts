import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get('/users', authMiddleware, authorize('ADMIN'), usersController.listUsers);
router.post('/users', authMiddleware, authorize('ADMIN'), usersController.createUser);

export default router;
