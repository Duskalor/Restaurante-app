import type { NextFunction, Request, Response } from 'express';
import { messageOf, statusOf } from '../utils/errors';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(error);
  res.status(statusOf(error)).json({
    error: messageOf(error) || 'Error interno del servidor',
  });
}
