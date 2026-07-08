const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const teacher1 = await prisma.user.findFirst({ where: { name: "Dra. Maria Josefa" } });
  const teacher2 = await prisma.user.findFirst({ where: { name: "Prof. João Neto" } });

  if (teacher1) {
    await prisma.lesson.create({
      data: {
        title: "Introdução à Termodinâmica",
        teacherId: teacher1.id,
        subject: "Fisica",
        description: "Nesta aula, exploraremos as leis fundamentais da termodinâmica e suas aplicações práticas no dia a dia. A termodinâmica estuda as relações entre calor, trabalho e outras formas de energia.",
        objectives: JSON.stringify([
          "Entender o conceito de energia interna",
          "Diferenciar calor e trabalho",
          "Aplicar a Primeira Lei da Termodinâmica"
        ]),
        materials: JSON.stringify([
          { type: 'PDF', title: 'Apostila Completa - Leis da Termo', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          { type: 'VIDEO', title: 'Experimento de Joule - Demonstração', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ])
      }
    });
  }

  if (teacher2) {
    await prisma.lesson.create({
      data: {
        title: "Cálculo de Derivadas Básicas",
        teacherId: teacher2.id,
        subject: "Matematica",
        description: "Aprenda a derivar funções polinomiais e entenda o conceito geométrico da derivada como taxa de variação.",
        objectives: JSON.stringify([
          "Definir o conceito de limite",
          "Aplicar a regra da potência",
          "Resolver problemas de otimização simples"
        ]),
        materials: JSON.stringify([
          { type: 'PDF', title: 'Lista de Exercícios Resolvidos', url: '#' }
        ])
      }
    });
  }

  console.log("Lessons seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
