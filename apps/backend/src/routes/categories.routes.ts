import { Router } from 'express';
import * as categoriesController from '../controllers/categories.controller';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get('/categories', authMiddleware, categoriesController.listCategories);
router.post(
  '/categories',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  categoriesController.createCategory
);

export default router;
