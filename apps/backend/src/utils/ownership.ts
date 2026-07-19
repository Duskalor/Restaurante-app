import prisma from '../prisma';
import type { AuthUser } from '../types/express';
import { HttpError } from './errors';

export async function ensureBranchBelongsToUser(branchId: string, user?: AuthUser): Promise<true> {
  if (user?.isSuperAdmin) return true;

  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      restaurantId: user?.restaurantId,
    },
  });

  if (!branch) {
    throw new HttpError('Sucursal no permitida para este restaurante', 403);
  }

  return true;
}

export async function ensureCategoryBelongsToUser(
  categoryId: string | null | undefined,
  user?: AuthUser
): Promise<true> {
  if (!categoryId) return true;
  if (user?.isSuperAdmin) return true;

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      branch: {
        restaurantId: user?.restaurantId,
      },
    },
  });

  if (!category) {
    throw new HttpError('Categoría no permitida para este restaurante', 403);
  }

  return true;
}

export async function ensureTableBelongsToUser(
  tableId: string | null | undefined,
  user?: AuthUser
): Promise<true> {
  if (!tableId) return true;
  if (user?.isSuperAdmin) return true;

  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      branch: {
        restaurantId: user?.restaurantId,
      },
    },
  });

  if (!table) {
    throw new HttpError('Mesa no permitida para este restaurante', 403);
  }

  return true;
}

export async function ensureProductBelongsToUser(productId: string, user?: AuthUser): Promise<true> {
  if (user?.isSuperAdmin) return true;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      branch: {
        restaurantId: user?.restaurantId,
      },
    },
  });

  if (!product) {
    throw new HttpError('Producto no permitido para este restaurante', 403);
  }

  return true;
}

export async function ensureOrderBelongsToUser(orderId: string, user?: AuthUser): Promise<true> {
  if (user?.isSuperAdmin) return true;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      branch: {
        restaurantId: user?.restaurantId,
      },
    },
  });

  if (!order) {
    throw new HttpError('Pedido no permitido para este restaurante', 403);
  }

  return true;
}
