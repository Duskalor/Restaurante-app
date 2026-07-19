import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { LoginResponse } from '@restaurante/shared';
import { env } from '../config/env';
import prisma from '../prisma';
import { HttpError } from '../utils/errors';
import { assertWire } from '../utils/wire';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      branch: true,
      role: true,
      restaurant: true,
    },
  });

  if (!user) {
    throw new HttpError('Credenciales inválidas', 401);
  }

  if (!user.isActive) {
    throw new HttpError('Usuario inactivo', 403);
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new HttpError('Credenciales inválidas', 401);
  }

  if (!user.isSuperAdmin) {
    if (!user.restaurantId || !user.restaurant) {
      throw new HttpError('El usuario no está asociado a ningún restaurante', 403);
    }

    if (user.restaurant.status !== 'ACTIVE') {
      throw new HttpError('La cuenta del restaurante está suspendida o inactiva', 403);
    }

    if (user.restaurant.expiresAt && new Date(user.restaurant.expiresAt) < new Date()) {
      throw new HttpError('La suscripción del restaurante ha vencido', 403);
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    },
  });

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      branchId: user.branchId,
      restaurantId: user.restaurantId || null,
      isSuperAdmin: user.isSuperAdmin || false,
    },
    env.JWT_SECRET,
    { expiresIn: '9h' }
  );

  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;

  return assertWire({
    message: 'Login correcto',
    token,
    user: userWithoutPassword,
  });
}
