import type { Request, Response } from 'express';
import * as rolesService from '../services/roles.service';
import { isPrismaError } from '../utils/errors';

export async function listRoles(_req: Request, res: Response) {
  try {
    res.json(await rolesService.listRoles());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
}

export async function createRole(req: Request, res: Response) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name es obligatorio' });
    }

    const role = await rolesService.createRole(name, description);

    res.status(201).json(role);
  } catch (error) {
    console.error(error);
    if (isPrismaError(error, 'P2002')) {
      return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear rol' });
  }
}
