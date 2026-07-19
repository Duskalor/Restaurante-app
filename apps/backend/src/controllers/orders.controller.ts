import type { Request, Response } from 'express';
import * as ordersService from '../services/orders.service';
import { HttpError, messageOf, statusOf } from '../utils/errors';
import {
  ensureBranchBelongsToUser,
  ensureOrderBelongsToUser,
  ensureProductBelongsToUser,
  ensureTableBelongsToUser,
} from '../utils/ownership';

export async function listOrders(req: Request, res: Response) {
  try {
    res.json(await ordersService.listOrders(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const order = await ordersService.getOrderById(id, req.user);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener detalle del pedido' });
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    const {
      branchId,
      tableId,
      customerId,
      waiterId,
      cashierId,
      orderType,
      channel,
      guestsCount,
      notes,
    } = req.body;

    if (!branchId || !orderType || !channel) {
      return res.status(400).json({ error: 'branchId, orderType y channel son obligatorios' });
    }

    await ensureBranchBelongsToUser(branchId, req.user);
    await ensureTableBelongsToUser(tableId, req.user);

    const order = await ordersService.createOrder({
      branchId,
      tableId,
      customerId,
      waiterId,
      cashierId,
      orderType,
      channel,
      guestsCount,
      notes,
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(statusOf(error)).json({ error: messageOf(error) || 'Error al crear pedido' });
  }
}

export async function addOrderItem(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { productId, qty, notes, discountAmount } = req.body;

    if (!productId || qty === undefined) {
      return res.status(400).json({ error: 'productId y qty son obligatorios' });
    }

    await ensureOrderBelongsToUser(id, req.user);
    await ensureProductBelongsToUser(productId, req.user);

    const orderItem = await ordersService.addOrderItem(id, {
      productId,
      qty,
      notes,
      discountAmount,
    });

    res.status(201).json(orderItem);
  } catch (error) {
    console.error(error);
    res
      .status(statusOf(error))
      .json({ error: messageOf(error) || 'Error al agregar item al pedido' });
  }
}

export async function updateOrderItem(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { qty, notes, discountAmount } = req.body;

    const updatedItem = await ordersService.updateOrderItem(id, { qty, notes, discountAmount });

    res.json(updatedItem);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar item del pedido' });
  }
}

export async function deleteOrderItem(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    await ordersService.deleteOrderItem(id);

    res.json({ message: 'Item eliminado correctamente' });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar item del pedido' });
  }
}

export async function deleteOrder(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    await ordersService.deleteOrder(id);

    res.json({ message: 'Pedido eliminado correctamente' });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar pedido' });
  }
}
