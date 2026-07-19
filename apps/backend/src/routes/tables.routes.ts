import { Router } from 'express';
import * as tablesController from '../controllers/tables.controller';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get('/tables', authMiddleware, tablesController.listTables);

router.post(
  '/tables',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  tablesController.createTable
);

router.patch(
  '/tables/:id/status',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  tablesController.updateTableStatus
);

router.delete(
  '/tables/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  tablesController.deleteTable
);

export default router;
