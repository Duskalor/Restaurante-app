import prisma from '../prisma';
import type { AuthUser } from '../types/express';
import { restaurantWhere } from '../utils/scopes';

export function listCategories(user?: AuthUser) {
  return prisma.category.findMany({
    where: restaurantWhere(user),
    orderBy: { sortOrder: 'asc' },
    include: { branch: true },
  });
}

export function createCategory(input: { branchId: string; name: string; sortOrder?: number }) {
  return prisma.category.create({
    data: {
      branchId: input.branchId,
      name: input.name,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}
