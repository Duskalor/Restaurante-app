import type { DecimalString, IsoDateString } from './common.js';
import type { KitchenItemStatus, OrderType } from './orders.js';

// /kitchen — apps/backend/src/services/kitchen.service.ts
// listKitchenOrders reshapes Order+OrderItem into a purpose-built projection —
// it is not a raw Prisma include, so it gets its own dedicated types.

export interface KitchenOrderItem {
  id: string;
  productName: string;
  qty: DecimalString;
  notes: string | null;
  kitchenStatus: KitchenItemStatus;
}

// GET /kitchen/orders — only orders that still have PENDING/PREPARING/READY items are included
export interface KitchenOrder {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  createdAt: IsoDateString;
  tableName: string | null;
  customerName: string | null;
  items: KitchenOrderItem[];
}

// PATCH /kitchen/items/:id/status — allowed values are a subset of KitchenItemStatus
// (kitchen.controller.ts only accepts PENDING | PREPARING | READY).
export type KitchenAllowedStatus = Extract<KitchenItemStatus, 'PENDING' | 'PREPARING' | 'READY'>;

export interface UpdateKitchenItemStatusRequest {
  kitchenStatus: KitchenAllowedStatus;
}
