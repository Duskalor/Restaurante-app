import type { NextFunction, Request, Response } from 'express';

export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'No autenticado',
        });
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'No tienes permiso para esta acción',
        });
      }

      next();
    } catch {
      return res.status(500).json({
        error: 'Error al validar permisos',
      });
    }
  };
}
