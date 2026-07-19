import axios from 'axios';
import type { Request, Response } from 'express';
import * as customersService from '../services/customers.service';
import { HttpError, isPrismaError } from '../utils/errors';

export async function lookupDni(req: Request, res: Response) {
  try {
    const dni = req.params.dni as string;

    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ error: 'El DNI debe tener 8 dígitos' });
    }

    return res.json(await customersService.lookupDni(dni));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data || error.message);

      if (error.response?.status === 401) {
        return res.status(401).json({ error: 'Token de APIPeru inválido o vencido' });
      }

      if (error.response?.status === 404 || error.response?.status === 422) {
        return res.status(404).json({ error: 'DNI no encontrado' });
      }

      return res.status(500).json({ error: 'Error consultando DNI en APIPeru' });
    }

    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error(error);
    return res.status(500).json({ error: 'Error consultando DNI en APIPeru' });
  }
}

export async function listCustomers(_req: Request, res: Response) {
  try {
    res.json(await customersService.listCustomers());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar clientes' });
  }
}

export async function createCustomer(req: Request, res: Response) {
  try {
    const { documentNumber, firstName, lastNamePaternal, lastNameMaternal } = req.body;

    if (!documentNumber || !/^\d{8}$/.test(documentNumber)) {
      return res.status(400).json({ error: 'DNI inválido' });
    }

    if (!firstName || !lastNamePaternal || !lastNameMaternal) {
      return res.status(400).json({ error: 'Completa nombres y apellidos' });
    }

    const customer = await customersService.createCustomer({
      documentNumber,
      firstName,
      lastNamePaternal,
      lastNameMaternal,
    });

    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
}

export async function deleteCustomer(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    await customersService.deleteCustomer(id);

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error(error);

    if (isPrismaError(error, 'P2025')) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
}
