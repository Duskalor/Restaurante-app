import bcrypt from 'bcryptjs';
import type {
  CreateRestaurantResponse,
  GetStatsResponse,
  RenewSubscriptionResponse,
  ResetPasswordResponse,
  SaasRestaurant,
} from '@restaurante/shared';
import prisma from '../prisma';
import { HttpError } from '../utils/errors';
import { assertWire } from '../utils/wire';

export async function getStats(): Promise<GetStatsResponse> {
  const totalRecaudado = await prisma.subscription.aggregate({
    _sum: { amount: true },
    where: { status: 'ACTIVE' },
  });
  const totalRestaurantes = await prisma.restaurant.count();

  return assertWire({
    totalIngresos: totalRecaudado._sum.amount || 0,
    totalRestaurantes,
  });
}

export async function listRestaurants(): Promise<SaasRestaurant[]> {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      branches: {
        orderBy: { createdAt: 'asc' },
      },
      users: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
        },
      },
      subscriptions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return assertWire(restaurants);
}

export interface CreateRestaurantInput {
  name: string;
  slug: string;
  subdomain: string;
  ruc?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  planType?: string | null;
  amount?: unknown;
  startsAt?: string | null;
  endsAt?: string | null;
  adminFirstName: string;
  adminLastName: string;
  adminEmail?: string | null;
  adminPassword: string;
  branchName?: string | null;
  branchCode?: string | null;
}

export function createRestaurant(input: CreateRestaurantInput): Promise<CreateRestaurantResponse> {
  return prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        name: input.name,
        slug: input.slug,
        subdomain: input.subdomain,
        ruc: input.ruc || null,
        phone: input.phone || null,
        address: input.address || null,
        logoUrl: input.logoUrl || null,
        planType: input.planType || 'TRIMESTRAL',
        status: 'ACTIVE',
        startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
        expiresAt: input.endsAt ? new Date(input.endsAt) : null,
      },
    });

    const branch = await tx.branch.create({
      data: {
        name: input.branchName || 'Sucursal Principal',
        code: input.branchCode || `${input.slug}-main`,
        address: input.address || null,
        phone: input.phone || null,
        restaurantId: restaurant.id,
      },
    });

    const adminRole = await tx.role.findFirst({
      where: {
        OR: [{ name: 'ADMIN' }, { name: 'Admin' }, { name: 'admin' }],
      },
    });

    if (!adminRole) {
      throw new Error('No existe el rol ADMIN en la base de datos');
    }

    const passwordHash = await bcrypt.hash(input.adminPassword, 10);

    const user = await tx.user.create({
      data: {
        firstName: input.adminFirstName,
        lastName: input.adminLastName,
        email: input.adminEmail || null,
        passwordHash,
        roleId: adminRole.id,
        branchId: branch.id,
        restaurantId: restaurant.id,
        isActive: true,
        isSuperAdmin: false,
      },
    });

    const subscription = await tx.subscription.create({
      data: {
        restaurantId: restaurant.id,
        planType: input.planType || 'TRIMESTRAL',
        amount: input.amount ? Number(input.amount) : 0,
        startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
        endsAt: input.endsAt ? new Date(input.endsAt) : (null as unknown as Date),
        status: 'ACTIVE',
      },
    });

    return assertWire({
      restaurant,
      branch,
      user,
      subscription,
    });
  });
}

export async function resetPassword(
  restaurantId: string,
  userId: string | undefined,
  newPassword: string
): Promise<ResetPasswordResponse> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      users: true,
    },
  });

  if (!restaurant) {
    throw new HttpError('Restaurante no encontrado', 404);
  }

  let targetUser = null;

  if (userId) {
    targetUser = restaurant.users.find((u) => u.id === userId) ?? null;
  }

  if (!targetUser) {
    targetUser = restaurant.users[0] || null;
  }

  if (!targetUser) {
    throw new HttpError('No se encontró un usuario administrador para este restaurante', 404);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: targetUser.id },
    data: { passwordHash },
  });

  return assertWire({
    message: 'Contraseña restablecida correctamente',
    userId: targetUser.id,
    email: targetUser.email,
  });
}

export async function renewSubscription(
  restaurantId: string,
  plan: string,
  amount: unknown
): Promise<RenewSubscriptionResponse> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new HttpError('Restaurante no encontrado', 404);
  }

  const startsAt = new Date();
  const endsAt = new Date(startsAt);

  if (plan === 'MENSUAL') {
    endsAt.setMonth(endsAt.getMonth() + 1);
  } else if (plan === 'TRIMESTRAL') {
    endsAt.setMonth(endsAt.getMonth() + 3);
  } else if (plan === 'ANUAL') {
    endsAt.setFullYear(endsAt.getFullYear() + 1);
  } else {
    throw new HttpError('Plan no válido (debe ser MENSUAL, TRIMESTRAL o ANUAL)', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedRestaurant = await tx.restaurant.update({
      where: { id: restaurantId },
      data: {
        planType: plan,
        status: 'ACTIVE',
        expiresAt: endsAt,
      },
    });

    const newSubscription = await tx.subscription.create({
      data: {
        restaurantId,
        planType: plan,
        amount: amount ? Number(amount) : 0,
        startsAt,
        endsAt,
        status: 'ACTIVE',
      },
    });

    return { updatedRestaurant, newSubscription };
  });

  return assertWire({
    message: 'Suscripción reactivada correctamente',
    expiresAt: result.updatedRestaurant.expiresAt,
  });
}

export async function deleteRestaurant(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      branches: { select: { id: true } },
      users: { select: { id: true } },
      subscriptions: { select: { id: true } },
    },
  });

  if (!restaurant) {
    throw new HttpError('Restaurante no encontrado', 404);
  }

  const branchIds = restaurant.branches.map((b) => b.id);

  await prisma.$transaction(async (tx) => {
    if (branchIds.length > 0) {
      await tx.businessSetting.deleteMany({
        where: { branchId: { in: branchIds } },
      });

      await tx.payment.deleteMany({
        where: { branchId: { in: branchIds } },
      });

      await tx.orderItem.deleteMany({
        where: {
          order: {
            branchId: { in: branchIds },
          },
        },
      });

      await tx.order.deleteMany({
        where: { branchId: { in: branchIds } },
      });

      await tx.product.deleteMany({
        where: { branchId: { in: branchIds } },
      });

      await tx.category.deleteMany({
        where: { branchId: { in: branchIds } },
      });

      await tx.table.deleteMany({
        where: { branchId: { in: branchIds } },
      });
    }

    await tx.subscription.deleteMany({
      where: { restaurantId },
    });

    await tx.user.deleteMany({
      where: { restaurantId },
    });

    await tx.branch.deleteMany({
      where: { restaurantId },
    });

    await tx.restaurant.delete({
      where: { id: restaurantId },
    });
  });
}
