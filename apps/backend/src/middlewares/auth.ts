import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUser } from '../types/express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token no enviado',
      });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Formato de token inválido',
      });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    req.user = decoded as AuthUser;
    next();
  } catch {
    return res.status(401).json({
      error: 'Token inválido o expirado',
    });
  }
}
