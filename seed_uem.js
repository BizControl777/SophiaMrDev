const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const exams = [
    {
      id: 'uem-2024-mat',
      title: 'Exame de Admissão UEM 2024 - Matemática',
      institution: 'UEM',
      year: 2024,
      subject: 'Matemática',
      isOld: true,
    },
    {
      id: 'uem-2024-fis',
      title: 'Exame de Admissão UEM 2024 - Física',
      institution: 'UEM',
      year: 2024,
      subject: 'Física',
      isOld: true,
    },
    {
      id: 'uem-2024-qui',
      title: 'Exame de Admissão UEM 2024 - Química',
      institution: 'UEM',
      year: 2024,
      subject: 'Química',
      isOld: true,
    },
    {
      id: 'uem-2024-bio',
      title: 'Exame de Admissão UEM 2024 - Biologia',
      institution: 'UEM',
      year: 2024,
      subject: 'Biologia',
      isOld: true,
    }
  ];

  for (const examData of exams) {
    await prisma.exam.upsert({
      where: { id: examData.id },
      update: {},
      create: examData,
    });
  }

  // Insert some questions for uem-2024-mat
  await prisma.question.createMany({
    data: [
      {
        examId: 'uem-2024-mat',
        text: 'Seja a função f(x) = 2x^2 - 4x + 5. Qual é o vértice da parábola correspondente?',
        options: JSON.stringify(['(1, 3)', '(-1, 11)', '(2, 5)', '(0, 5)']),
        correctAnswer: 0,
        explanation: 'A coordenada x do vértice é dada por -b/2a = -(-4)/(2*2) = 1. Substituindo na função, f(1) = 2 - 4 + 5 = 3. Logo o vértice é (1, 3).',
        subject: 'Matemática',
        topic: 'Função Quadrática',
        difficulty: 'médio',
        university: 'UEM',
        year: 2024
      },
      {
        examId: 'uem-2024-mat',
        text: 'Qual é o valor do limite lim(x->0) sen(x)/x ?',
        options: JSON.stringify(['0', '1', 'Infinito', 'Não existe']),
        correctAnswer: 1,
        explanation: 'Este é o limite fundamental trigonométrico e o seu valor é 1.',
        subject: 'Matemática',
        topic: 'Limites',
        difficulty: 'fácil',
        university: 'UEM',
        year: 2024
      },
      {
        examId: 'uem-2024-mat',
        text: 'A derivada da função f(x) = e^(2x) é:',
        options: JSON.stringify(['e^(2x)', '2e^(2x)', '2xe^(2x-1)', 'e^x']),
        correctAnswer: 1,
        explanation: 'Usando a regra da cadeia, a derivada de e^(u) é e^(u) * u\'. Onde u = 2x e u\' = 2.',
        subject: 'Matemática',
        topic: 'Derivadas',
        difficulty: 'médio',
        university: 'UEM',
        year: 2024
      }
    ]
  });

  // Questions for Física
  await prisma.question.createMany({
    data: [
      {
        examId: 'uem-2024-fis',
        text: 'Qual é a unidade de medida da força no Sistema Internacional (SI)?',
        options: JSON.stringify(['Joule', 'Watt', 'Newton', 'Pascal']),
        correctAnswer: 2,
        explanation: 'A unidade de medida de força no SI é o Newton (N), definido como kg*m/s^2.',
        subject: 'Física',
        topic: 'Mecânica',
        difficulty: 'fácil',
        university: 'UEM',
        year: 2024
      },
      {
        examId: 'uem-2024-fis',
        text: 'A lei de Ohm relaciona tensão (V), corrente (I) e resistência (R) pela fórmula:',
        options: JSON.stringify(['V = I/R', 'V = I*R', 'V = R/I', 'V = I^2*R']),
        correctAnswer: 1,
        explanation: 'A primeira lei de Ohm afirma que a tensão é diretamente proporcional à corrente e à resistência (V = R*I).',
        subject: 'Física',
        topic: 'Eletromagnetismo',
        difficulty: 'fácil',
        university: 'UEM',
        year: 2024
      }
    ]
  });

  // Questions for Química
  await prisma.question.createMany({
    data: [
      {
        examId: 'uem-2024-qui',
        text: 'Quantos elétrons um átomo neutro de carbono possui?',
        options: JSON.stringify(['4', '6', '8', '12']),
        correctAnswer: 1,
        explanation: 'O carbono tem número atômico 6, portanto, no seu estado neutro possui 6 elétrons.',
        subject: 'Química',
        topic: 'Estrutura Atômica',
        difficulty: 'fácil',
        university: 'UEM',
        year: 2024
      }
    ]
  });

  // Questions for Biologia
  await prisma.question.createMany({
    data: [
      {
        examId: 'uem-2024-bio',
        text: 'Qual é a organela responsável pela respiração celular?',
        options: JSON.stringify(['Ribossomo', 'Cloroplasto', 'Mitocôndria', 'Complexo de Golgi']),
        correctAnswer: 2,
        explanation: 'A mitocôndria é a organela onde ocorre a maior parte da respiração celular e síntese de ATP.',
        subject: 'Biologia',
        topic: 'Citologia',
        difficulty: 'fácil',
        university: 'UEM',
        year: 2024
      }
    ]
  });

  console.log('Exames e questões inseridos com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
