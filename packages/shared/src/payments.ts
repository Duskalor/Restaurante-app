import type { Customer, DecimalString, IsoDateString } from './common.js';
import type { Branch } from './branches.js';
import type { Order, OrderWithTotals } from './orders.js';

// /payments — apps/backend/src/services/payments.service.ts

const PAYMENT_METHOD = {
  CASH: 'CASH',
  CARD: 'CARD',
  YAPE: 'YAPE',
  PLIN: 'PLIN',
  TRANSFER: 'TRANSFER',
} as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];
export { PAYMENT_METHOD };

export interface Payment {
  id: string;
  branchId: string;
  orderId: string;
  cashSessionId: string | null;
  customerId: string | null;
  method: PaymentMethod;
  amount: DecimalString;
  referenceCode: string | null;
  currency: string;
  paidAt: IsoDateString;
  createdById: string;
  createdAt: IsoDateString;
}

// GET /payments, POST /payments — include: { order: true, customer: true, branch: true }
export interface PaymentWithRelations extends Payment {
  order: Order;
  customer: Customer | null;
  branch: Branch;
}

export interface CreatePaymentRequest {
  branchId: string;
  orderId: string;
  customerId?: string | null;
  method: PaymentMethod;
  amount: number;
  referenceCode?: string | null;
  createdById: string;
}

// PATCH /orders/:id/pay
export interface PayOrderRequest {
  method: PaymentMethod;
  amount: number;
  createdById: string;
  customerId?: string | null;
}

export interface PayOrderResponse {
  message: string;
  payment: Payment;
  order: OrderWithTotals | null;
}

// PATCH /payments/:id
export interface UpdatePaymentRequest {
  method?: PaymentMethod;
  amount?: number;
}

export interface UpdatePaymentResponse {
  message: string;
  payment: Payment;
}
