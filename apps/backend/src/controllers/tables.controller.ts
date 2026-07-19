import type { TableStatus } from '@prisma/client';
import type { Request, Response } from 'express';
import * as tablesService from '../services/tables.service';
import { HttpError, isPrismaError, messageOf, statusOf } from '../utils/errors';
import { ensureBranchBelongsToUser } from '../utils/ownership';

export async function listTables(req: Request, res: Response) {
  try {
    res.json(await tablesService.listTables(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener mesas' });
  }
}

export async function createTable(req: Request, res: Response) {
  try {
    const { branchId, diningAreaId, number, name, capacity, status, posX, posY } = req.body;

    if (!branchId || number === undefined || !capacity) {
      return res.status(400).json({ error: 'branchId, number y capacity son obligatorios' });
    }

    await ensureBranchBelongsToUser(branchId, req.user);

    const table = await tablesService.createTable({
      branchId,
      diningAreaId,
      number,
      name,
      capacity,
      status,
      posX,
      posY,
    });

    res.status(201).json(table);
  } catch (error) {
    console.error(error);
    if (isPrismaError(error, 'P2002')) {
      return res.status(400).json({ error: 'Ya existe una mesa con ese número en la sucursal' });
    }
    res.status(statusOf(error)).json({ error: messageOf(error) || 'Error al crear mesa' });
  }
}

export async function updateTableStatus(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const allowedStatuses = ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'DISABLED'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const table = await tablesService.updateTableStatus(id, status as TableStatus);

    res.json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado de mesa' });
  }
}

export async function deleteTable(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    await tablesService.deleteTable(id);

    res.json({ message: 'Mesa eliminada correctamente' });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar mesa' });
  }
}
