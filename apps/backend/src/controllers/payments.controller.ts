import type { Request, Response } from 'express';
import * as paymentsService from '../services/payments.service';
import { HttpError } from '../utils/errors';

export async function listPayments(_req: Request, res: Response) {
  try {
    res.json(await paymentsService.listPayments());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
}

export async function createPayment(req: Request, res: Response) {
  try {
    const { branchId, orderId, customerId, method, amount, referenceCode, createdById } = req.body;

    if (!branchId || !orderId || !method || amount === undefined || !createdById) {
      return res.status(400).json({
        error: 'branchId, orderId, method, amount y createdById son obligatorios',
      });
    }

    const payment = await paymentsService.createPayment({
      branchId,
      orderId,
      customerId,
      method,
      amount,
      referenceCode,
      createdById,
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear pago' });
  }
}

export async function payOrder(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { method, amount, createdById, customerId = null } = req.body;

    res.json(await paymentsService.payOrder(id, { method, amount, createdById, customerId }));
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al cobrar pedido' });
  }
}

export async function updatePayment(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { method, amount } = req.body;

    const updatedPayment = await paymentsService.updatePayment(id, { method, amount });

    res.json({
      message: 'Pago actualizado correctamente',
      payment: updatedPayment,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar pago' });
  }
}

export async function deletePayment(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    await paymentsService.deletePayment(id);

    res.json({ message: 'Pago eliminado correctamente' });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar pago' });
  }
}
