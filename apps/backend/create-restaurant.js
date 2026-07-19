const prisma = require('./src/prisma');

async function main() {
  let restaurant = await prisma.restaurant.findUnique({
    where: { slug: 'demo' },
  });

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'Restaurante Demo',
        slug: 'demo',
        subdomain: 'demo',
        status: 'ACTIVE',
      },
    });
    console.log('Restaurant created:', restaurant.id);
  } else {
    console.log('Restaurant already exists:', restaurant.id);
  }

  const branches = await prisma.branch.updateMany({
    where: { restaurantId: null },
    data: { restaurantId: restaurant.id },
  });
  console.log('Branches linked:', branches.count);

  const users = await prisma.user.updateMany({
    where: { restaurantId: null, isSuperAdmin: false },
    data: { restaurantId: restaurant.id },
  });
  console.log('Users linked:', users.count);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
