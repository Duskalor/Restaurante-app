import type { IsoDateString } from './common.js';
import type { Branch } from './branches.js';

// /tables — apps/backend/src/services/tables.service.ts

const TABLE_STATUS = {
  FREE: 'FREE',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
  CLEANING: 'CLEANING',
  DISABLED: 'DISABLED',
} as const;

export type TableStatus = (typeof TABLE_STATUS)[keyof typeof TABLE_STATUS];
export { TABLE_STATUS };

export interface DiningArea {
  id: string;
  branchId: string;
  name: string;
  createdAt: IsoDateString;
}

export interface Table {
  id: string;
  branchId: string;
  diningAreaId: string | null;
  number: number;
  name: string | null;
  capacity: number;
  status: TableStatus;
  posX: number | null;
  posY: number | null;
  isActive: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

// GET /tables, POST /tables — include: { branch: true, diningArea: true }
export interface TableWithRelations extends Table {
  branch: Branch;
  diningArea: DiningArea | null;
}

export interface CreateTableRequest {
  branchId: string;
  diningAreaId?: string | null;
  number: number;
  name?: string | null;
  capacity: number;
  status?: TableStatus;
  posX?: number;
  posY?: number;
}

// PATCH /tables/:id/status
export interface UpdateTableStatusRequest {
  status: TableStatus;
}
