import type { IsoDateString } from './common.js';

// GET /branches, POST /branches — apps/backend/src/services/branches.service.ts

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  restaurantId: string | null;
}

export interface CreateBranchRequest {
  name: string;
  code: string;
  address?: string;
  phone?: string;
}
