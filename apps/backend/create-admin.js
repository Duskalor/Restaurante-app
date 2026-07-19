const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@restaurante.com';
  const password = 'Admin123456';
  const passwordHash = await bcrypt.hash(password, 10);

  const branch = await prisma.branch.findFirst({
    where: { isActive: true },
  });

  if (!branch) {
    console.log('No existe sucursal activa.');
    return;
  }

  const adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    console.log('No existe rol ADMIN en la base.');
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  const data = {
    firstName: 'Administrador',
    lastName: 'Principal',
    email,
    passwordHash,
    isActive: true,
    branch: {
      connect: { id: branch.id },
    },
    role: {
      connect: { id: adminRole.id },
    },
  };

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data,
    });

    console.log('Usuario admin actualizado correctamente.');
    console.log({ email, password });
    return;
  }

  const user = await prisma.user.create({
    data,
  });

  console.log('Usuario admin creado correctamente.');
  console.log({
    email: user.email,
    password,
  });
}

main()
  .catch((error) => {
    console.error('Error creando admin:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });