import type { Request, Response } from 'express';
import * as categoriesService from '../services/categories.service';
import { isPrismaError } from '../utils/errors';

export async function listCategories(req: Request, res: Response) {
  try {
    res.json(await categoriesService.listCategories(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const { branchId, name, sortOrder } = req.body;

    if (!branchId || !name) {
      return res.status(400).json({ error: 'branchId y name son obligatorios' });
    }

    const category = await categoriesService.createCategory({ branchId, name, sortOrder });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    if (isPrismaError(error, 'P2002')) {
      return res
        .status(400)
        .json({ error: 'Ya existe una categoría con ese nombre en la sucursal' });
    }
    res.status(500).json({ error: 'Error al crear categoría' });
  }
}
