import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get('/orders', authMiddleware, ordersController.listOrders);
router.get('/orders/:id', authMiddleware, ordersController.getOrderById);

router.post(
  '/orders',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  ordersController.createOrder
);

router.post(
  '/orders/:id/items',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  ordersController.addOrderItem
);

router.patch(
  '/order-items/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  ordersController.updateOrderItem
);

router.delete(
  '/order-items/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  ordersController.deleteOrderItem
);

router.delete(
  '/orders/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'CAJA'),
  ordersController.deleteOrder
);

export default router;
