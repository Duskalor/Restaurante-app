const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.role.findFirst({
    where: { name: 'ADMIN' },
  });

  if (existing) {
    console.log('El rol ADMIN ya existe.');
    return;
  }

  const role = await prisma.role.create({
    data: {
      name: 'ADMIN',
    },
  });

  console.log('Rol creado correctamente:');
  console.log(role);
}

main()
  .catch((error) => {
    console.error('Error creando rol:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });