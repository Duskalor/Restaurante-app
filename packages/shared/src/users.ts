import type { IsoDateString } from './common.js';
import type { Branch } from './branches.js';
import type { Role } from './roles.js';
import type { Restaurant } from './saas.js';

// /users — apps/backend/src/services/users.service.ts
// Both listUsers and createUser strip `passwordHash` before responding.

export interface User {
  id: string;
  branchId: string;
  roleId: string;
  firstName: string;
  lastName: string;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  restaurantId: string | null;
  isSuperAdmin: boolean;
}

// GET /users — include: { branch: true, role: true }
export interface UserWithBranchAndRole extends User {
  branch: Branch;
  role: Role;
}

// POST /users — include: { branch: true, role: true, restaurant: true }
export interface UserWithRestaurant extends UserWithBranchAndRole {
  restaurant: Restaurant | null;
}

export interface CreateUserRequest {
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
