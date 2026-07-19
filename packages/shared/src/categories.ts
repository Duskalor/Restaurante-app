import type { IsoDateString } from './common.js';
import type { Branch } from './branches.js';

// /categories — apps/backend/src/services/categories.service.ts

export interface Category {
  id: string;
  branchId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: IsoDateString;
}

// GET /categories — include: { branch: true }
export interface CategoryWithBranch extends Category {
  branch: Branch;
}

export interface CreateCategoryRequest {
  branchId: string;
  name: string;
  sortOrder?: number;
}
