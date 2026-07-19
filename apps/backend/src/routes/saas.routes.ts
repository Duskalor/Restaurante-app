import { Router } from 'express';
import * as saasController from '../controllers/saas.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireSuperAdmin } from '../middlewares/require-super-admin';

const router = Router();

router.get('/saas/stats', authMiddleware, requireSuperAdmin, saasController.getStats);
router.get('/saas/restaurants', authMiddleware, requireSuperAdmin, saasController.listRestaurants);
router.post('/saas/restaurants', authMiddleware, requireSuperAdmin, saasController.createRestaurant);

router.patch(
  '/saas/restaurants/:id/reset-password',
  authMiddleware,
  requireSuperAdmin,
  saasController.resetPassword
);

router.patch(
  '/saas/restaurants/:id/renew',
  authMiddleware,
  requireSuperAdmin,
  saasController.renewSubscription
);

router.delete(
  '/saas/restaurants/:id',
  authMiddleware,
  requireSuperAdmin,
  saasController.deleteRestaurant
);

export default router;
