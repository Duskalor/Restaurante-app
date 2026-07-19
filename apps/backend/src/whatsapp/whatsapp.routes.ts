import { Router } from 'express';
import {
  createDeliveryOrder,
  processOrderMessage,
  testIncomingMessage,
} from './whatsapp.controller';

const router = Router();

router.post('/test-message', testIncomingMessage);
router.post('/create-delivery-order', createDeliveryOrder);
router.post('/process-order', processOrderMessage);

export default router;
