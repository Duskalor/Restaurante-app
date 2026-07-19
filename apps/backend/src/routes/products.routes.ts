import { Router } from 'express';
import { uploadProductImage } from '../config/uploads';
import * as productsController from '../controllers/products.controller';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.post(
  '/products/upload-image',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  uploadProductImage.single('image'),
  productsController.uploadProductImage
);

router.get('/products', authMiddleware, productsController.listProducts);

router.post(
  '/products',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  productsController.createProduct
);

router.patch(
  '/products/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  productsController.updateProduct
);

router.delete(
  '/products/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  productsController.deleteProduct
);

export default router;
