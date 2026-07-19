import type { Request, Response } from 'express';
import {
  createDeliveryOrderFromWhatsapp,
  processWhatsappOrder,
  simulateWhatsappOrder,
} from './whatsapp.service';
import { messageOf } from '../utils/errors';

export async function testIncomingMessage(req: Request, res: Response) {
  try {
    const { message, customerPhone } = req.body;

    const result = await simulateWhatsappOrder({
      message,
      customerPhone,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error en testIncomingMessage:', error);
    return res.status(500).json({
      error: 'Error interno al procesar mensaje de WhatsApp',
    });
  }
}

export async function createDeliveryOrder(req: Request, res: Response) {
  try {
    const { branchId, customerName, customerPhone, deliveryAddress, reference, notes, parsedItems } =
      req.body;

    const result = await createDeliveryOrderFromWhatsapp({
      branchId,
      customerName,
      customerPhone,
      deliveryAddress,
      reference,
      notes,
      parsedItems,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error en createDeliveryOrder:', error);
    return res.status(400).json({
      error: messageOf(error) || 'No se pudo crear el pedido delivery',
    });
  }
}

export async function processOrderMessage(req: Request, res: Response) {
  try {
    const { branchId, customerName, customerPhone, deliveryAddress, reference, notes, message } =
      req.body;

    const result = await processWhatsappOrder({
      branchId,
      customerName,
      customerPhone,
      deliveryAddress,
      reference,
      notes,
      message,
    });

    return res.status(result.ok ? 201 : 200).json(result);
  } catch (error) {
    console.error('Error en processOrderMessage:', error);
    return res.status(400).json({
      error: messageOf(error) || 'No se pudo procesar el pedido de WhatsApp',
    });
  }
}
