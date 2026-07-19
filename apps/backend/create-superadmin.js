const bcrypt = require('bcryptjs');
const prisma = require('./src/prisma');

const EMAIL = 'superadmin@restaurante.com';
const PASSWORD = 'Super123456';

async function main() {
  const adminRole = await prisma.role.findFirst({
    where: { OR: [{ name: 'ADMIN' }, { name: 'Admin' }, { name: 'admin' }] },
  });

  if (!adminRole) {
    throw new Error('ADMIN role not found. Run create-roles.js first.');
  }

  const branch = await prisma.branch.findFirst();

  if (!branch) {
    throw new Error('No branch found. Run create-branch.js first.');
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      passwordHash,
      isSuperAdmin: true,
      isActive: true,
    },
    create: {
      email: EMAIL,
      firstName: 'Super',
      lastName: 'Admin',
      passwordHash,
      roleId: adminRole.id,
      branchId: branch.id,
      restaurantId: null,
      isSuperAdmin: true,
      isActive: true,
    },
  });

  console.log('Superadmin ready:', user.email, '| isSuperAdmin:', user.isSuperAdmin);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
