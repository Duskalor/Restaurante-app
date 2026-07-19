import { Router } from 'express';
import * as customersController from '../controllers/customers.controller';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get(
  '/clients/lookup/dni/:dni',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'CAJA', 'MOZO'),
  customersController.lookupDni
);

router.get(
  '/customers',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'CAJA', 'MOZO'),
  customersController.listCustomers
);

router.post(
  '/customers',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'CAJA', 'MOZO'),
  customersController.createCustomer
);

router.delete(
  '/customers/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'CAJA'),
  customersController.deleteCustomer
);

export default router;
