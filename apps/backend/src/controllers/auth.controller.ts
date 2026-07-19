import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { HttpError } from '../utils/errors';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'email y password son obligatorios',
      });
    }

    res.json(await authService.login(email, password));
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}
