import axios from 'axios';
import { env } from '../config/env';
import prisma from '../prisma';
import { HttpError } from '../utils/errors';

export function listCustomers() {
  return prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCustomer(input: {
  documentNumber: string;
  firstName: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
}) {
  const fullName = `${input.firstName} ${input.lastNamePaternal} ${input.lastNameMaternal}`
    .replace(/\s+/g, ' ')
    .trim();

  const existingCustomer = await prisma.customer.findFirst({
    where: { documentNumber: input.documentNumber },
  });

  if (existingCustomer) {
    throw new HttpError('Ya existe un cliente con ese DNI', 400);
  }

  return prisma.customer.create({
    data: {
      fullName,
      documentNumber: input.documentNumber,
    },
  });
}

export function deleteCustomer(id: string) {
  return prisma.customer.delete({
    where: { id },
  });
}

interface ApiPeruResponse {
  success?: boolean;
  data?: {
    numero?: string;
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    nombre_completo?: string;
  };
}

export async function lookupDni(dni: string) {
  const token = env.APIPERU_TOKEN;

  if (!token) {
    throw new HttpError('APIPERU_TOKEN no configurado en el backend', 500);
  }

  const response = await axios.post<ApiPeruResponse>(
    'https://apiperu.dev/api/dni',
    { dni },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const apiData = response.data;

  if (!apiData?.success || !apiData?.data) {
    throw new HttpError('No se encontraron datos para ese DNI', 404);
  }

  const person = apiData.data;

  return {
    documentNumber: person.numero || dni,
    firstName: person.nombres || '',
    lastNamePaternal: person.apellido_paterno || '',
    lastNameMaternal: person.apellido_materno || '',
    fullName:
      person.nombre_completo ||
      [person.nombres || '', person.apellido_paterno || '', person.apellido_materno || '']
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
  };
}
