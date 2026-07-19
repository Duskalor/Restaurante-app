import { Router } from 'express';
import * as paymentsController from '../controllers/payments.controller';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get('/payments', authMiddleware, authorize('ADMIN', 'CAJA'), paymentsController.listPayments);

router.post(
  '/payments',
  authMiddleware,
  authorize('ADMIN', 'CAJA'),
  paymentsController.createPayment
);

router.patch(
  '/orders/:id/pay',
  authMiddleware,
  authorize('ADMIN', 'CAJA', 'SUPERVISOR'),
  paymentsController.payOrder
);

router.patch(
  '/payments/:id',
  authMiddleware,
  authorize('ADMIN', 'CAJA', 'SUPERVISOR'),
  paymentsController.updatePayment
);

router.delete(
  '/payments/:id',
  authMiddleware,
  authorize('ADMIN', 'CAJA', 'SUPERVISOR'),
  paymentsController.deletePayment
);

export default router;
