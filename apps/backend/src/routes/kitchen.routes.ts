import { Router } from 'express';
import * as kitchenController from '../controllers/kitchen.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.get('/kitchen/orders', authMiddleware, kitchenController.listKitchenOrders);
router.patch('/kitchen/items/:id/status', authMiddleware, kitchenController.updateKitchenItemStatus);

export default router;
