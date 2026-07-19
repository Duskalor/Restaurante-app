import type { Request, Response } from 'express';
import * as branchesService from '../services/branches.service';
import { isPrismaError, statusOf } from '../utils/errors';

export async function listBranches(req: Request, res: Response) {
  try {
    res.json(await branchesService.listBranches(req.user));
  } catch (error) {
    console.error(error);
    res.status(statusOf(error)).json({ error: 'Error al obtener sucursales' });
  }
}

export async function createBranch(req: Request, res: Response) {
  try {
    const { name, code, address, phone } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'name y code son obligatorios' });
    }

    const branch = await branchesService.createBranch({ name, code, address, phone });

    res.status(201).json(branch);
  } catch (error) {
    console.error(error);
    if (isPrismaError(error, 'P2002')) {
      return res.status(400).json({ error: 'Ya existe una sucursal con ese código' });
    }
    res.status(500).json({ error: 'Error al crear sucursal' });
  }
}
