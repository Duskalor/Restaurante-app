import type { Request, Response } from 'express';
import * as saasService from '../services/saas.service';
import { HttpError, isPrismaError, messageOf } from '../utils/errors';

export async function getStats(_req: Request, res: Response) {
  try {
    res.json(await saasService.getStats());
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener métricas del sistema' });
  }
}

export async function listRestaurants(_req: Request, res: Response) {
  try {
    res.json(await saasService.listRestaurants());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener restaurantes' });
  }
}

export async function createRestaurant(req: Request, res: Response) {
  try {
    const { name, slug, subdomain, adminFirstName, adminLastName, adminPassword } = req.body;

    if (!name || !slug || !subdomain || !adminFirstName || !adminLastName || !adminPassword) {
      return res.status(400).json({
        error: 'Faltan datos obligatorios para crear el restaurante',
      });
    }

    const result = await saasService.createRestaurant(req.body);

    res.status(201).json(result);
  } catch (error) {
    console.error(error);

    if (isPrismaError(error, 'P2002')) {
      return res
        .status(400)
        .json({ error: 'Ya existe un restaurante, subdominio, sucursal o correo con esos datos' });
    }

    res.status(500).json({ error: messageOf(error) || 'Error al crear restaurante SaaS' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { userId, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    res.json(await saasService.resetPassword(id, userId, newPassword));
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
}

export async function renewSubscription(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { plan, amount } = req.body;

    if (!plan) {
      return res.status(400).json({ error: 'El plan es obligatorio para renovar' });
    }

    res.json(await saasService.renewSubscription(id, plan, amount));
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error al renovar suscripción:', error);
    res.status(500).json({ error: 'Error interno al renovar suscripción' });
  }
}

export async function deleteRestaurant(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    await saasService.deleteRestaurant(id);

    return res.json({ message: 'Restaurante eliminado correctamente' });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('ERROR ELIMINANDO RESTAURANTE:', error);
    return res.status(500).json({
      error: messageOf(error) || 'Error al eliminar restaurante',
    });
  }
}
