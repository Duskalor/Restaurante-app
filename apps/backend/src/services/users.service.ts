import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import type { AuthUser } from '../types/express';
import { HttpError } from '../utils/errors';
import { getRestaurantScope } from '../utils/scopes';

export async function listUsers(user?: AuthUser) {
  const where = getRestaurantScope(user);

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      branch: true,
      role: true,
    },
  });

  return users.map(({ passwordHash: _passwordHash, ...rest }) => rest);
}

export interface CreateUserInput {
  branchId: string;
  roleId: string;
  firstName: string;
  lastName?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  password: string;
  avatarUrl?: string;
}

export async function createUser(input: CreateUserInput, currentUser: AuthUser) {
  const branch = await prisma.branch.findFirst({
    where: {
      id: input.branchId,
      restaurantId: currentUser.restaurantId,
    },
  });

  if (!branch) {
    throw new HttpError('La sucursal no pertenece a tu restaurante', 403);
  }

  const role = await prisma.role.findUnique({
    where: { id: input.roleId },
  });

  if (!role) {
    throw new HttpError('Rol no encontrado', 404);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      branchId: input.branchId,
      restaurantId: currentUser.restaurantId,
      roleId: input.roleId,
      firstName: input.firstName,
      lastName: input.lastName || '',
      documentNumber: input.documentNumber || null,
      phone: input.phone || null,
      email: input.email || null,
      passwordHash,
      avatarUrl: input.avatarUrl || null,
      isActive: true,
      isSuperAdmin: false,
    },
    include: {
      branch: true,
      role: true,
      restaurant: true,
    },
  });

  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
