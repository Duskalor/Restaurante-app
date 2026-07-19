import type { DecimalString, IsoDateString } from './common.js';
import type { Branch } from './branches.js';

// /saas/* — apps/backend/src/services/saas.service.ts, controllers/saas.controller.ts
// Super-admin only. Consumed by apps/frontend/src/features/saas/SaaSPanel.tsx.

/**
 * `Restaurant.status` and `Restaurant.planType` are plain `String` columns in
 * schema.prisma (not Prisma enums), so the DB genuinely accepts any string. We keep
 * the wire type as `string` rather than forcing a union that could silently go stale.
 */
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  ruc: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  status: string;
  planType: string;
  startsAt: IsoDateString;
  expiresAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface Subscription {
  id: string;
  restaurantId: string;
  planType: string;
  amount: DecimalString;
  startsAt: IsoDateString;
  endsAt: IsoDateString;
  status: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/**
 * `saas.service.listRestaurants()` selects a narrow projection of User fields
 * (`select: { id, email, firstName, lastName, isActive, createdAt }`) — this is
 * intentionally NOT the full `User` type from users.ts.
 */
export interface SaasUser {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: IsoDateString;
}

// GET /saas/restaurants
export interface SaasRestaurant extends Restaurant {
  branches: Branch[];
  users: SaasUser[];
  subscriptions: Subscription[];
}

// GET /saas/stats
export interface GetStatsResponse {
  totalIngresos: DecimalString;
  totalRestaurantes: number;
}

// POST /saas/restaurants
export interface CreateRestaurantRequest {
  name: string;
  slug: string;
  subdomain: string;
  ruc?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  planType?: string;
  amount?: number;
  startsAt?: string;
  endsAt?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail?: string | null;
  adminPassword: string;
  branchName?: string;
  branchCode?: string;
}

/**
 * KNOWN CONTRACT GAP (mirrored, not fixed here): `saas.service.createRestaurant`
 * returns the raw `tx.user.create(...)` result and the controller serializes it
 * as-is — unlike login/listUsers/createUser, it does NOT strip `passwordHash`
 * before sending the response. This type documents what the backend actually
 * sends today. See packages/shared/README.md and the phase-1 handoff notes
 * before treating this as fixed.
 */
export interface SaasCreatedUser {
  id: string;
  branchId: string;
  restaurantId: string | null;
  roleId: string;
  firstName: string;
  lastName: string;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  passwordHash: string;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  isSuperAdmin: boolean;
}

export interface CreateRestaurantResponse {
  restaurant: Restaurant;
  branch: Branch;
  user: SaasCreatedUser;
  subscription: Subscription;
}

// PATCH /saas/restaurants/:id/reset-password
export interface ResetPasswordRequest {
  userId?: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  userId: string;
  email: string | null;
}

// PATCH /saas/restaurants/:id/renew
export interface RenewSubscriptionRequest {
  plan: string;
  amount?: number;
}

export interface RenewSubscriptionResponse {
  message: string;
  expiresAt: IsoDateString | null;
}
