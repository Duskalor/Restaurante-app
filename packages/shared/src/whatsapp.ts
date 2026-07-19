import type { DecimalString } from './common.js';
import type { OrderItem } from './orders.js';

// /whatsapp — apps/backend/src/whatsapp/{whatsapp.service,whatsapp.parser,whatsapp.controller}.ts

export interface ParsedOrderItem {
  productKey: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface ParsedOrder {
  ok: boolean;
  items: ParsedOrderItem[];
  total: number;
  needsConfirmation: boolean;
  message: string;
}

// POST /whatsapp/test
export interface SimulateWhatsappOrderRequest {
  message?: string;
  customerPhone?: string;
}

export interface SimulateWhatsappOrderResponse {
  customerPhone?: string;
  parsed: ParsedOrder;
  reply: string;
}

// POST /whatsapp/delivery-order
export interface CreateDeliveryOrderRequest {
  branchId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  reference?: string | null;
  notes?: string | null;
  parsedItems: ParsedOrderItem[];
}

export interface DeliveryOrderCustomer {
  name: string;
  phone: string;
  address: string;
  reference: string | null;
}

export interface CreateDeliveryOrderResponse {
  ok: true;
  orderId: string;
  orderNumber: string;
  total: DecimalString;
  customer: DeliveryOrderCustomer;
  items: OrderItem[];
}

// POST /whatsapp/process-order
export interface ProcessOrderMessageRequest {
  branchId?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  reference?: string | null;
  notes?: string | null;
  message: string;
}

export type ProcessOrderMessageResponse =
  | { ok: false; parsed: ParsedOrder; reply: string }
  | { ok: true; parsed: ParsedOrder; order: CreateDeliveryOrderResponse; reply: string };
