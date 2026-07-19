import type { Customer, DecimalString, IsoDateString } from './common.js';
import type { Branch } from './branches.js';
import type { Table } from './tables.js';
import type { Product } from './products.js';
import type { Payment } from './payments.js';

// /orders — apps/backend/src/services/orders.service.ts

const ORDER_TYPE = {
  DINE_IN: 'DINE_IN',
  TAKEOUT: 'TAKEOUT',
  DELIVERY: 'DELIVERY',
} as const;
export type OrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE];
export { ORDER_TYPE };

const ORDER_CHANNEL = {
  SALON: 'SALON',
  DELIVERY: 'DELIVERY',
  PICKUP: 'PICKUP',
  WHATSAPP: 'WHATSAPP',
  PHONE: 'PHONE',
  OTHER: 'OTHER',
} as const;
export type OrderChannel = (typeof ORDER_CHANNEL)[keyof typeof ORDER_CHANNEL];
export { ORDER_CHANNEL };

const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  IN_KITCHEN: 'IN_KITCHEN',
  READY: 'READY',
  SERVED: 'SERVED',
  BILLED: 'BILLED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export { ORDER_STATUS };

const KITCHEN_ITEM_STATUS = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
  CANCELLED: 'CANCELLED',
} as const;
export type KitchenItemStatus = (typeof KITCHEN_ITEM_STATUS)[keyof typeof KITCHEN_ITEM_STATUS];
export { KITCHEN_ITEM_STATUS };

export interface OrderItemModifier {
  id: string;
  orderItemId: string;
  modifierNameSnapshot: string;
  optionNameSnapshot: string;
  extraPrice: DecimalString;
  qty: DecimalString;
  total: DecimalString;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productNameSnapshot: string;
  qty: DecimalString;
  unitPrice: DecimalString;
  taxRate: DecimalString;
  discountAmount: DecimalString;
  subtotal: DecimalString;
  total: DecimalString;
  notes: string | null;
  kitchenStatus: KitchenItemStatus;
  sentToKitchenAt: IsoDateString | null;
  readyAt: IsoDateString | null;
  servedAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

// POST /orders/:id/items — include: { product: true }
export interface OrderItemWithProduct extends OrderItem {
  product: Product | null;
}

// GET /orders/:id items — include: { product: true, modifiers: true }
export interface OrderItemDetail extends OrderItem {
  product: Product | null;
  modifiers: OrderItemModifier[];
}

export interface Order {
  id: string;
  branchId: string;
  customerId: string | null;
  tableId: string | null;
  waiterId: string | null;
  cashierId: string | null;
  orderNumber: string;
  orderType: OrderType;
  channel: OrderChannel;
  status: OrderStatus;
  guestsCount: number | null;
  subtotal: DecimalString;
  tax: DecimalString;
  discountTotal: DecimalString;
  serviceCharge: DecimalString;
  total: DecimalString;
  notes: string | null;
  openedAt: IsoDateString | null;
  sentToKitchenAt: IsoDateString | null;
  closedAt: IsoDateString | null;
  cancelledAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

// GET /orders — include: { branch, table, customer, items, payments }
export interface OrderListItem extends Order {
  branch: Branch;
  table: Table | null;
  customer: Customer | null;
  items: OrderItem[];
  payments: Payment[];
}

// GET /orders/:id — include: { branch, table, customer, items: { product, modifiers }, payments }
export interface OrderDetail extends Order {
  branch: Branch;
  table: Table | null;
  customer: Customer | null;
  items: OrderItemDetail[];
  payments: Payment[];
}

// POST /orders — include: { branch, table, customer, items } (no payments key at creation time)
export interface CreatedOrder extends Order {
  branch: Branch;
  table: Table | null;
  customer: Customer | null;
  items: OrderItem[];
}

/**
 * Shape returned by `recalculateOrderTotals` (include: items, payments, table, customer —
 * deliberately no `branch`). Used as the `order` field of `PayOrderResponse` in payments.ts.
 */
export interface OrderWithTotals extends Order {
  items: OrderItem[];
  payments: Payment[];
  table: Table | null;
  customer: Customer | null;
}

export interface CreateOrderRequest {
  branchId: string;
  tableId?: string | null;
  customerId?: string | null;
  waiterId?: string | null;
  cashierId?: string | null;
  orderType: OrderType;
  channel: OrderChannel;
  guestsCount?: number;
  notes?: string | null;
}

export interface AddOrderItemRequest {
  productId: string;
  qty: number;
  notes?: string | null;
  discountAmount?: number;
}

export interface UpdateOrderItemRequest {
  qty?: number;
  notes?: string | null;
  discountAmount?: number;
}
