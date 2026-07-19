import prisma from '../prisma';

export function listRoles() {
  return prisma.role.findMany({
    orderBy: { createdAt: 'asc' },
  });
}

export function createRole(name: string, description?: string | null) {
  return prisma.role.create({
    data: {
      name,
      description: description || null,
    },
  });
}
