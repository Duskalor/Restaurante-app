import type { KitchenItemStatus } from '@prisma/client';
import type { Request, Response } from 'express';
import * as kitchenService from '../services/kitchen.service';
import { HttpError } from '../utils/errors';

export async function listKitchenOrders(req: Request, res: Response) {
  try {
    res.json(await kitchenService.listKitchenOrders(req.user));
  } catch (error) {
    console.error('Error obteniendo pedidos de cocina:', error);
    res.status(500).json({ error: 'No se pudo cargar cocina.' });
  }
}

export async function updateKitchenItemStatus(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { kitchenStatus } = req.body;

    const allowedStatuses = ['PENDING', 'PREPARING', 'READY'];

    if (!allowedStatuses.includes(kitchenStatus)) {
      return res.status(400).json({ error: 'Estado de cocina inválido.' });
    }

    const updatedItem = await kitchenService.updateKitchenItemStatus(
      id,
      kitchenStatus as KitchenItemStatus,
      req.user
    );

    return res.json(updatedItem);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error actualizando estado de cocina:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el estado.' });
  }
}
