const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findTeacher() {
  const user = await prisma.user.findFirst({
    where: {
      name: {
        contains: 'João Neto',
      },
    },
  });
  console.log(JSON.stringify(user, null, 2));
}

findTeacher()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
