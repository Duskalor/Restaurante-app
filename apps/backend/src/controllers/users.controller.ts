import type { Request, Response } from 'express';
import * as usersService from '../services/users.service';
import { HttpError, isPrismaError, statusOf } from '../utils/errors';

export async function listUsers(req: Request, res: Response) {
  try {
    res.json(await usersService.listUsers(req.user));
  } catch (error) {
    console.error(error);
    res.status(statusOf(error)).json({ error: 'Error al obtener usuarios' });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const {
      branchId,
      roleId,
      firstName,
      lastName,
      documentNumber,
      phone,
      email,
      password,
      avatarUrl,
    } = req.body;

    if (!branchId || !roleId || !firstName || !password) {
      return res.status(400).json({
        error: 'branchId, roleId, firstName y password son obligatorios',
      });
    }

    if (!req.user?.restaurantId) {
      return res.status(403).json({
        error: 'No se pudo identificar el restaurante del usuario actual',
      });
    }

    const user = await usersService.createUser(
      { branchId, roleId, firstName, lastName, documentNumber, phone, email, password, avatarUrl },
      req.user
    );

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    if (isPrismaError(error, 'P2002')) {
      return res.status(400).json({
        error: 'Ya existe un usuario con ese correo',
      });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
}
