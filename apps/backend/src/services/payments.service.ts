import type { PaymentMethod } from '@prisma/client';
import prisma from '../prisma';
import { HttpError } from '../utils/errors';
import { recalculateOrderTotals } from './orders.service';

export function listPayments() {
  return prisma.payment.findMany({
    orderBy: { paidAt: 'desc' },
    include: {
      order: true,
      customer: true,
      branch: true,
    },
  });
}

export interface CreatePaymentInput {
  branchId: string;
  orderId: string;
  customerId?: string | null;
  method: string;
  amount: unknown;
  referenceCode?: string | null;
  createdById: string;
}

export function createPayment(input: CreatePaymentInput) {
  return prisma.payment.create({
    data: {
      branchId: input.branchId,
      orderId: input.orderId,
      customerId: input.customerId || null,
      method: input.method as PaymentMethod,
      amount: Number(input.amount),
      referenceCode: input.referenceCode || null,
      createdById: input.createdById,
    },
    include: {
      order: true,
      customer: true,
      branch: true,
    },
  });
}

export interface PayOrderInput {
  method: string;
  amount: unknown;
  createdById: string;
  customerId?: string | null;
}

export async function payOrder(orderId: string, input: PayOrderInput) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
      table: true,
    },
  });

  if (!order) {
    throw new HttpError('Pedido no encontrado', 404);
  }

  if (!input.amount || Number(input.amount) <= 0) {
    throw new HttpError('Monto inválido', 400);
  }

  const payment = await prisma.payment.create({
    data: {
      orderId,
      customerId: input.customerId || order.customerId || null,
      method: input.method as PaymentMethod,
      amount: Number(input.amount),
      createdById: input.createdById,
      branchId: order.branchId,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PAID',
      customerId: input.customerId || order.customerId || null,
    },
  });

  if (order.tableId) {
    await prisma.table.update({
      where: { id: order.tableId },
      data: { status: 'FREE' },
    });
  }

  const updatedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
      table: true,
      customer: true,
    },
  });

  return {
    message: 'Pedido cobrado correctamente',
    payment,
    order: updatedOrder,
  };
}

export async function updatePayment(id: string, input: { method?: string; amount?: unknown }) {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new HttpError('Pago no encontrado', 404);
  }

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: {
      method: (input.method as PaymentMethod) || undefined,
      amount: input.amount !== undefined ? Number(input.amount) : undefined,
    },
  });

  await recalculateOrderTotals(payment.orderId);

  return updatedPayment;
}

export async function deletePayment(id: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new HttpError('Pago no encontrado', 404);
  }

  await prisma.payment.delete({
    where: { id },
  });

  const order = await prisma.order.findUnique({
    where: { id: payment.orderId },
    include: {
      items: true,
      payments: true,
      table: true,
    },
  });

  if (order) {
    const newStatus = (order.items || []).length > 0 ? 'CONFIRMED' : 'DRAFT';

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
      },
    });

    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: {
          status: 'OCCUPIED',
        },
      });
    }
  }
}
