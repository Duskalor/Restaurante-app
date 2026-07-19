import type { NextFunction, Request, Response } from 'express';
import prisma from '../prisma';

export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: {
        id: true,
        isSuperAdmin: true,
      },
    });

    if (!user || !user.isSuperAdmin) {
      return res.status(403).json({
        error: 'Acceso solo para super admin',
      });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Error validando super admin',
    });
  }
}
