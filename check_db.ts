import { db } from "./apps/backend/src/lib/db";

async function checkExams() {
  const exams = await db.exam.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { _count: { select: { questions: true } } }
  });
  console.log(JSON.stringify(exams, null, 2));
}

checkExams()
  .catch(e => console.error(e))
  .finally(() => process.exit());
