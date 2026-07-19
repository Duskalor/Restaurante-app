const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'cocina@restaurante.com';
  const password = 'Cocina123';

  const branch = await prisma.branch.findFirst({
    where: { isActive: true },
  });

  if (!branch) {
    console.log('No existe sucursal activa.');
    return;
  }

  let kitchenRole = await prisma.role.findFirst({
    where: { name: 'COCINA' },
  });

  if (!kitchenRole) {
    kitchenRole = await prisma.role.create({
      data: {
        name: 'COCINA',
      },
    });
    console.log('Rol COCINA creado.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  const data = {
    firstName: 'Usuario',
    lastName: 'Cocina',
    email,
    passwordHash,
    isActive: true,
    branch: {
      connect: { id: branch.id },
    },
    role: {
      connect: { id: kitchenRole.id },
    },
  };

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data,
    });

    console.log('Usuario cocina actualizado correctamente.');
    console.log({ email, password });
    return;
  }

  await prisma.user.create({
    data,
  });

  console.log('Usuario cocina creado correctamente.');
  console.log({ email, password });
}

main()
  .catch((error) => {
    console.error('Error creando usuario cocina:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  