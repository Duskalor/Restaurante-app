export interface AuthUser {
  userId: string;
  email: string | null;
  role: string;
  branchId: string | null;
  restaurantId: string | null;
  isSuperAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
