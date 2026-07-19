import prisma from '../prisma';
import type { AuthUser } from '../types/express';
import { getRestaurantScope } from '../utils/scopes';

export function listBranches(user?: AuthUser) {
  const where = getRestaurantScope(user);

  return prisma.branch.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export function createBranch(data: {
  name: string;
  code: string;
  address?: string;
  phone?: string;
}) {
  return prisma.branch.create({ data });
}
