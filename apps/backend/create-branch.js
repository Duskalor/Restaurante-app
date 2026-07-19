const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const existingBranch = await prisma.branch.findFirst();

  if (existingBranch) {
    console.log('Ya existe una sucursal:', existingBranch.name);
    return;
  }

  const branch = await prisma.branch.create({
    data: {
      name: 'PRINCIPAL',
      code: 'principal',
      address: 'Sucursal principal',
      phone: '999999999',
      isActive: true,
    },
  });

  console.log('Sucursal creada correctamente:');
  console.log(branch);
}

main()
  .catch((error) => {
    console.error('Error creando sucursal:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });