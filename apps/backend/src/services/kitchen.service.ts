import type { KitchenItemStatus } from '@prisma/client';
import prisma from '../prisma';
import type { AuthUser } from '../types/express';
import { HttpError } from '../utils/errors';
import { restaurantWhere } from '../utils/scopes';

export async function listKitchenOrders(user?: AuthUser) {
  const orders = await prisma.order.findMany({
    where: restaurantWhere(user),
    include: {
      table: true,
      customer: true,
      branch: true,
      items: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return orders
    .map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      createdAt: order.createdAt,
      tableName: order.table ? `Mesa ${order.table.number}` : null,
      customerName: order.customer?.fullName || null,
      items: (order.items || [])
        .filter((item) => ['PENDING', 'PREPARING', 'READY'].includes(item.kitchenStatus))
        .map((item) => ({
          id: item.id,
          productName: item.productNameSnapshot,
          qty: item.qty,
          notes: item.notes,
          kitchenStatus: item.kitchenStatus,
        })),
    }))
    .filter((order) => order.items.length > 0);
}

export async function updateKitchenItemStatus(
  itemId: string,
  kitchenStatus: KitchenItemStatus,
  user?: AuthUser
) {
  const existingItem = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: {
      order: {
        include: {
          branch: true,
        },
      },
    },
  });

  if (!existingItem) {
    throw new HttpError('Item no encontrado.', 404);
  }

  if (!user?.isSuperAdmin && existingItem.order?.branch?.restaurantId !== user?.restaurantId) {
    throw new HttpError('No tienes permiso para modificar items de otro restaurante.', 403);
  }

  return prisma.orderItem.update({
    where: { id: itemId },
    data: { kitchenStatus },
  });
}
