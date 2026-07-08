const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExams() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { _count: { select: { questions: true } } }
  });
  console.log(JSON.stringify(exams, null, 2));
}

checkExams()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
