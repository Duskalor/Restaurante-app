import type { AuthUser } from '../types/express';
import { HttpError } from './errors';

export function getRestaurantScope(user?: AuthUser): { restaurantId?: string } {
  if (user?.isSuperAdmin) {
    return {};
  }

  if (!user?.restaurantId) {
    throw new HttpError('Usuario sin restaurantId', 403);
  }

  return { restaurantId: user.restaurantId };
}

export function getBranchScope(user?: AuthUser): { branchId?: string } {
  if (user?.isSuperAdmin) {
    return {};
  }

  if (!user?.branchId) {
    throw new HttpError('Usuario sin branchId', 403);
  }

  return { branchId: user.branchId };
}

export function restaurantWhere(user?: AuthUser): object {
  return user?.isSuperAdmin
    ? {}
    : {
        branch: {
          restaurantId: user?.restaurantId,
        },
      };
}
