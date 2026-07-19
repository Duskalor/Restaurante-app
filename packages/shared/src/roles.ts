import type { IsoDateString } from './common.js';

// GET /roles, POST /roles — apps/backend/src/services/roles.service.ts

export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: IsoDateString;
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
}
