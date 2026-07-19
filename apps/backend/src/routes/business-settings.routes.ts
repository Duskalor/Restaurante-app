import { Router } from 'express';
import { uploadLogo } from '../config/uploads';
import * as businessSettingsController from '../controllers/business-settings.controller';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get(
  '/settings/business/:branchId',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  businessSettingsController.getBusinessSetting
);

router.post(
  '/settings/business/upload-logo',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  uploadLogo.single('logo'),
  businessSettingsController.uploadLogo
);

router.post(
  '/settings/business',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  businessSettingsController.saveBusinessSetting
);

export default router;
