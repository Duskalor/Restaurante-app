import type { Request, Response } from 'express';
import * as businessSettingsService from '../services/business-settings.service';
import { messageOf, statusOf } from '../utils/errors';
import { ensureBranchBelongsToUser } from '../utils/ownership';

export async function getBusinessSetting(req: Request, res: Response) {
  try {
    const branchId = req.params.branchId as string;

    await ensureBranchBelongsToUser(branchId, req.user);

    const setting = await businessSettingsService.getBusinessSetting(branchId);

    res.json(setting || null);
  } catch (error) {
    console.error(error);
    res.status(statusOf(error)).json({
      error: messageOf(error) || 'Error al obtener configuración del negocio',
    });
  }
}

export async function uploadLogo(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;

    res.json({
      message: 'Logo subido correctamente',
      fileUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir logo' });
  }
}

export async function saveBusinessSetting(req: Request, res: Response) {
  try {
    const { branchId, businessName, ruc, address, phone, logoUrl } = req.body;

    if (!branchId || !businessName) {
      return res.status(400).json({
        error: 'branchId y businessName son obligatorios',
      });
    }

    const setting = await businessSettingsService.upsertBusinessSetting({
      branchId,
      businessName,
      ruc,
      address,
      phone,
      logoUrl,
    });

    res.json(setting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar configuración del negocio' });
  }
}
