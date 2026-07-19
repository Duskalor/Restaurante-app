import type { UserWithRestaurant } from './users.js';

// POST /auth/login — apps/backend/src/services/auth.service.ts
// Response `user` is the login-query result (include: branch, role, restaurant)
// minus `passwordHash` — same shape as POST /users' response.

export type AuthenticatedUser = UserWithRestaurant;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthenticatedUser;
}
