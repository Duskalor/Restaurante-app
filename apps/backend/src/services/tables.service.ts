import type { TableStatus } from '@prisma/client';
import type { Table, TableWithRelations } from '@restaurante/shared';
import prisma from '../prisma';
import type { AuthUser } from '../types/express';
import { HttpError } from '../utils/errors';
import { restaurantWhere } from '../utils/scopes';
import { assertWire } from '../utils/wire';

export async function listTables(user?: AuthUser): Promise<TableWithRelations[]> {
  const tables = await prisma.table.findMany({
    where: restaurantWhere(user),
    orderBy: { number: 'asc' },
    include: {
      branch: true,
      diningArea: true,
    },
  });

  return assertWire(tables);
}

export interface CreateTableInput {
  branchId: string;
  diningAreaId?: string | null;
  number: unknown;
  name?: string | null;
  capacity: unknown;
  status?: string;
  posX?: unknown;
  posY?: unknown;
}

export async function createTable(input: CreateTableInput): Promise<TableWithRelations> {
  const table = await prisma.table.create({
    data: {
      branchId: input.branchId,
      diningAreaId: input.diningAreaId || null,
      number: Number(input.number),
      name: input.name || null,
      capacity: Number(input.capacity),
      status: (input.status || 'FREE') as TableStatus,
      posX: input.posX !== undefined ? Number(input.posX) : null,
      posY: input.posY !== undefined ? Number(input.posY) : null,
    },
    include: {
      branch: true,
      diningArea: true,
    },
  });

  return assertWire(table);
}

export async function updateTableStatus(id: string, status: TableStatus): Promise<Table> {
  const table = await prisma.table.update({
    where: { id },
    data: { status },
  });

  return assertWire(table);
}

export async function deleteTable(id: string) {
  const table = await prisma.table.findUnique({
    where: { id },
  });

  if (!table) {
    throw new HttpError('Mesa no encontrada', 404);
  }

  if (table.status === 'OCCUPIED') {
    throw new HttpError('No se puede eliminar una mesa ocupada', 400);
  }

  await prisma.table.delete({
    where: { id },
  });
}
