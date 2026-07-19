import type { DecimalString, IsoDateString } from './common.js';
import type { Branch } from './branches.js';
import type { Category } from './categories.js';

// /products — apps/backend/src/services/products.service.ts

export interface Product {
  id: string;
  branchId: string;
  categoryId: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: DecimalString;
  taxRate: DecimalString;
  costReference: DecimalString | null;
  preparationTimeMinutes: number | null;
  availableForSale: boolean;
  isActive: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

// GET /products, POST /products, PATCH /products/:id — include: { category: true, branch: true }
export interface ProductWithRelations extends Product {
  category: Category | null;
  branch: Branch;
}

export interface CreateProductRequest {
  branchId: string;
  categoryId?: string | null;
  sku?: string | null;
  name: string;
  description?: string | null;
  price: number;
  taxRate?: number;
  costReference?: number | null;
  preparationTimeMinutes?: number | null;
  imageUrl?: string | null;
}

export interface UpdateProductRequest {
  categoryId?: string | null;
  sku?: string | null;
  name?: string;
  description?: string | null;
  price?: number;
  taxRate?: number;
  costReference?: number | null;
  preparationTimeMinutes?: number | null;
  availableForSale?: boolean;
  imageUrl?: string | null;
}

export interface UploadProductImageResponse {
  message: string;
  fileUrl: string;
}
