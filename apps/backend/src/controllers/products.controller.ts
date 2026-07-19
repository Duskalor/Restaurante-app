import type { Request, Response } from 'express';
import * as productsService from '../services/products.service';
import { isPrismaError, messageOf, statusOf } from '../utils/errors';
import { ensureBranchBelongsToUser, ensureCategoryBelongsToUser } from '../utils/ownership';

export async function uploadProductImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/products/${req.file.filename}`;

    res.json({
      message: 'Imagen subida correctamente',
      fileUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir imagen del producto' });
  }
}

export async function listProducts(req: Request, res: Response) {
  try {
    res.json(await productsService.listProducts(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const {
      branchId,
      categoryId,
      sku,
      name,
      description,
      price,
      taxRate,
      costReference,
      preparationTimeMinutes,
      imageUrl,
    } = req.body;

    if (!branchId || !name || price === undefined) {
      return res.status(400).json({ error: 'branchId, name y price son obligatorios' });
    }

    await ensureBranchBelongsToUser(branchId, req.user);
    await ensureCategoryBelongsToUser(categoryId, req.user);

    const product = await productsService.createProduct({
      branchId,
      categoryId,
      sku,
      name,
      description,
      price,
      taxRate,
      costReference,
      preparationTimeMinutes,
      imageUrl,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    if (isPrismaError(error, 'P2002')) {
      return res.status(400).json({ error: 'Ya existe un producto con ese SKU en la sucursal' });
    }
    res.status(statusOf(error)).json({ error: messageOf(error) || 'Error al crear producto' });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const product = await productsService.updateProduct(id, req.body);

    res.json(product);
  } catch (error) {
    console.error(error);
    if (isPrismaError(error, 'P2025')) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (isPrismaError(error, 'P2002')) {
      return res.status(400).json({ error: 'Ya existe un producto con ese SKU en la sucursal' });
    }
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    await productsService.deleteProduct(id);

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error(error);
    if (isPrismaError(error, 'P2025')) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
}
