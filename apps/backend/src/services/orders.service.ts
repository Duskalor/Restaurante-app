import type { OrderChannel, OrderType } from '@prisma/client';
import type {
  CreatedOrder,
  OrderDetail,
  OrderItemWithProduct,
  OrderListItem,
} from '@restaurante/shared';
import prisma from '../prisma';
import type { AuthUser } from '../types/express';
import { HttpError } from '../utils/errors';
import { restaurantWhere } from '../utils/scopes';
import { assertWire } from '../utils/wire';

export async function listOrders(user?: AuthUser): Promise<OrderListItem[]> {
  const orders = await prisma.order.findMany({
    where: restaurantWhere(user),
    orderBy: { createdAt: 'desc' },
    include: {
      branch: true,
      table: true,
      customer: true,
      items: true,
      payments: true,
    },
  });

  return assertWire(orders);
}

export async function getOrderById(id: string, user?: AuthUser): Promise<OrderDetail | null> {
  const order = await prisma.order.findFirst({
    where: user?.isSuperAdmin
      ? { id }
      : {
          id,
          branch: {
            restaurantId: user?.restaurantId,
          },
        },
    include: {
      branch: true,
      table: true,
      customer: true,
      items: {
        include: {
          product: true,
          modifiers: true,
        },
      },
      payments: true,
    },
  });

  return order ? assertWire(order) : null;
}

export interface CreateOrderInput {
  branchId: string;
  tableId?: string | null;
  customerId?: string | null;
  waiterId?: string | null;
  cashierId?: string | null;
  orderType: string;
  channel: string;
  guestsCount?: unknown;
  notes?: string | null;
}

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const count = await prisma.order.count({ where: { branchId: input.branchId } });
  const orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;

  const order = await prisma.order.create({
    data: {
      branchId: input.branchId,
      tableId: input.tableId || null,
      customerId: input.customerId || null,
      waiterId: input.waiterId || null,
      cashierId: input.cashierId || null,
      orderNumber,
      orderType: input.orderType as OrderType,
      channel: input.channel as OrderChannel,
      guestsCount: input.guestsCount !== undefined ? Number(input.guestsCount) : null,
      notes: input.notes || null,
      status: 'CONFIRMED',
      subtotal: 0,
      tax: 0,
      discountTotal: 0,
      serviceCharge: 0,
      total: 0,
      openedAt: new Date(),
    },
    include: {
      branch: true,
      table: true,
      customer: true,
      items: true,
    },
  });

  if (input.tableId) {
    await prisma.table.update({
      where: { id: input.tableId },
      data: { status: 'OCCUPIED' },
    });
  }

  return assertWire(order);
}

export interface AddOrderItemInput {
  productId: string;
  qty: unknown;
  notes?: string | null;
  discountAmount?: unknown;
}

export async function addOrderItem(
  orderId: string,
  input: AddOrderItemInput
): Promise<OrderItemWithProduct> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new HttpError('Pedido no encontrado', 404);
  }

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) {
    throw new HttpError('Producto no encontrado', 404);
  }

  const quantity = Number(input.qty);
  const unitPrice = Number(product.price);
  const taxRate = Number(product.taxRate);
  const itemDiscount = input.discountAmount !== undefined ? Number(input.discountAmount) : 0;

  const subtotal = quantity * unitPrice;
  const total = subtotal - itemDiscount;

  const orderItem = await prisma.orderItem.create({
    data: {
      orderId,
      productId: product.id,
      productNameSnapshot: product.name,
      qty: quantity,
      unitPrice,
      taxRate,
      discountAmount: itemDiscount,
      subtotal,
      total,
      notes: input.notes || null,
      kitchenStatus: 'PENDING',
    },
    include: {
      product: true,
    },
  });

  const allItems = await prisma.orderItem.findMany({
    where: { orderId },
  });

  const newSubtotal = allItems.reduce((acc, item) => acc + Number(item.subtotal), 0);
  const newTax = allItems.reduce(
    (acc, item) =>
      acc + (Number(item.subtotal) - Number(item.discountAmount)) * Number(item.taxRate),
    0
  );
  const newDiscountTotal = allItems.reduce((acc, item) => acc + Number(item.discountAmount), 0);
  const newTotal = newSubtotal - newDiscountTotal + newTax;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal: newSubtotal,
      tax: newTax,
      discountTotal: newDiscountTotal,
      total: newTotal,
      status: 'CONFIRMED',
    },
  });

  return assertWire(orderItem);
}

export interface UpdateOrderItemInput {
  qty?: unknown;
  notes?: string | null;
  discountAmount?: unknown;
}

export async function updateOrderItem(itemId: string, input: UpdateOrderItemInput) {
  const existingItem = await prisma.orderItem.findUnique({
    where: { id: itemId },
  });

  if (!existingItem) {
    throw new HttpError('Item del pedido no encontrado', 404);
  }

  const quantity = input.qty !== undefined ? Number(input.qty) : Number(existingItem.qty);

  if (quantity <= 0) {
    throw new HttpError('La cantidad debe ser mayor a cero', 400);
  }

  const itemDiscount =
    input.discountAmount !== undefined
      ? Number(input.discountAmount)
      : Number(existingItem.discountAmount);

  const subtotal = quantity * Number(existingItem.unitPrice);
  const total = subtotal - itemDiscount;

  const updatedItem = await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      qty: quantity,
      notes: input.notes !== undefined ? input.notes || null : existingItem.notes,
      discountAmount: itemDiscount,
      subtotal,
      total,
    },
  });

  await recalculateOrderTotals(existingItem.orderId);

  return updatedItem;
}

export async function deleteOrderItem(itemId: string) {
  const existingItem = await prisma.orderItem.findUnique({
    where: { id: itemId },
  });

  if (!existingItem) {
    throw new HttpError('Item del pedido no encontrado', 404);
  }

  await prisma.orderItem.delete({
    where: { id: itemId },
  });

  await recalculateOrderTotals(existingItem.orderId);
}

export async function deleteOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
    },
  });

  if (!order) {
    throw new HttpError('Pedido no encontrado', 404);
  }

  await prisma.payment.deleteMany({
    where: { orderId },
  });

  await prisma.orderItem.deleteMany({
    where: { orderId },
  });

  await prisma.order.delete({
    where: { id: orderId },
  });

  if (order.tableId) {
    await prisma.table.update({
      where: { id: order.tableId },
      data: { status: 'FREE' },
    });
  }
}

function normalizeOrderStatus(order: { payments?: unknown[]; items?: unknown[] }) {
  const hasPayments = (order.payments || []).length > 0;
  const hasItems = (order.items || []).length > 0;

  if (hasPayments) return 'PAID' as const;
  if (hasItems) return 'CONFIRMED' as const;
  return 'DRAFT' as const;
}

export async function recalculateOrderTotals(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
    },
  });

  if (!order) return null;

  const subtotal = (order.items || []).reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
  const discountTotal = (order.items || []).reduce(
    (acc, item) => acc + Number(item.discountAmount || 0),
    0
  );
  const tax = (order.items || []).reduce(
    (acc, item) => acc + Number(item.total || 0) * Number(item.taxRate || 0),
    0
  );
  const total = subtotal - discountTotal + tax;

  return prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal,
      discountTotal,
      tax,
      total,
      status: normalizeOrderStatus(order),
    },
    include: {
      items: true,
      payments: true,
      table: true,
      customer: true,
    },
  });
}
