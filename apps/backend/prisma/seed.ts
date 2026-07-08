import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Limpar banco de dados em ordem para evitar erros de chave estrangeira
  await prisma.simulation.deleteMany({})
  await prisma.lessonRequest.deleteMany({})
  await prisma.teacherProfile.deleteMany({})
  await prisma.question.deleteMany({})
  await prisma.exam.deleteMany({})
  await prisma.user.deleteMany({})

  console.log("Iniciando semeio de dados (Moçambique - SQLite)...")

  // Criar Usuário Administrador
  const admin = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000000",
      name: "Administrador SophIA",
      email: "admin@sophia.mz",
      password: "123456",
      role: "ADMIN",
      balance: 0.00,
      reputation: 9999,
    },
  })

  // Criar Usuário Aluno Ativo (António Kumbe)
  const student = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "António Kumbe",
      email: "antonio.kumbe@exemplo.com",
      password: "123456",
      role: "STUDENT",
      balance: 5000.00,
      reputation: 1847,
    },
  })

  // Criar Outros Estudantes para o Ranking Realista
  await prisma.user.create({
    data: {
      name: "Luisa M.",
      email: "luisa.m@exemplo.com",
      password: "123456",
      role: "STUDENT",
      balance: 1200.00,
      reputation: 2340,
    }
  })

  await prisma.user.create({
    data: {
      name: "João P.",
      email: "joao.p@exemplo.com",
      password: "123456",
      role: "STUDENT",
      balance: 1500.00,
      reputation: 2180,
    }
  })

  await prisma.user.create({
    data: {
      name: "Ana F.",
      email: "ana.f@exemplo.com",
      password: "123456",
      role: "STUDENT",
      balance: 800.00,
      reputation: 2050,
    }
  })

  await prisma.user.create({
    data: {
      name: "Rafael N.",
      email: "rafael.n@exemplo.com",
      password: "123456",
      role: "STUDENT",
      balance: 300.00,
      reputation: 1980,
    }
  })

  await prisma.user.create({
    data: {
      name: "Cláudia S.",
      email: "claudia.s@exemplo.com",
      password: "123456",
      role: "STUDENT",
      balance: 2400.00,
      reputation: 1920,
    }
  })

  await prisma.user.create({
    data: {
      name: "Bruno M.",
      email: "bruno.m@exemplo.com",
      password: "123456",
      role: "STUDENT",
      balance: 950.00,
      reputation: 1830,
    }
  })

  await prisma.user.create({
    data: {
      name: "Fátima M.",
      email: "fatima.m@exemplo.com",
      password: "123456",
      role: "STUDENT",
      balance: 1100.00,
      reputation: 1798,
    }
  })

  // Criar Usuário Professor 1 (João Neto - UEM)
  const teacher1User = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Prof. João Neto",
      email: "joao.neto@uem.mz",
      password: "123456",
      role: "TEACHER",
      balance: 25000.00,
      reputation: 2500,
    },
  })

  await prisma.teacherProfile.create({
    data: {
      userId: teacher1User.id,
      subject: "Matemática",
      bio: "Especialista em Cálculo e Geometria Analítica. Professor na UEM com vasta experiência em exames de admissão.",
      experience: "15 anos",
      pricePerLesson: 1500.00,
      institution: "UEM",
      specialties: "Cálculo I, II, III; Álgebra Linear; Trigonometria",
      rating: 4.9,
    },
  })

  // Criar Usuário Professor 2 (Maria Josefa - UP)
  const teacher2User = await prisma.user.create({
    data: {
      name: "Dra. Maria Josefa",
      email: "maria.josefa@up.ac.mz",
      password: "123456",
      role: "TEACHER",
      balance: 18000.00,
      reputation: 1800,
    },
  })

  await prisma.teacherProfile.create({
    data: {
      userId: teacher2User.id,
      subject: "Física",
      bio: "Doutorada em Física Teórica. Apaixonada por tornar a mecânica clássica simples para todos os estudantes.",
      experience: "10 anos",
      pricePerLesson: 2000.00,
      institution: "UP",
      specialties: "Mecânica; Eletromagnetismo; Termodinâmica",
      rating: 4.8,
    },
  })

  // Criar Exames de Admissão
  await prisma.exam.create({
    data: {
      id: "uem-2023-mat",
      title: "Exame de Admissão UEM 2023",
      institution: "UEM",
      year: 2023,
      subject: "Matemática",
      isOld: true,
      questions: {
        create: [
          {
            text: "Qual é o valor de x na equação log2(x) = 5?",
            options: JSON.stringify(["10", "25", "32", "64"]),
            correctAnswer: 2,
            explanation: "Pela definição de logaritmo, loga(b) = c <=> a^c = b. Logo, 2^5 = 32.",
            subject: "Matemática",
            university: "UEM",
            year: 2023
          },
          {
            text: "A derivada de f(x) = sen(x) é:",
            options: JSON.stringify(["cos(x)", "-cos(x)", "tg(x)", "sec(x)"]),
            correctAnswer: 0,
            explanation: "A derivada da função seno é a função cosseno.",
            subject: "Matemática",
            university: "UEM",
            year: 2023
          }
        ]
      }
    },
  })

  await prisma.exam.create({
    data: {
      id: "up-2022-fis",
      title: "Exame de Admissão UP 2022",
      institution: "UP",
      year: 2022,
      subject: "Física",
      isOld: true,
      questions: {
        create: [
          {
            text: "Qual é a unidade de força no Sistema Internacional?",
            options: JSON.stringify(["Joule", "Watt", "Newton", "Pascal"]),
            correctAnswer: 2,
            explanation: "Newton (N) é a unidade de força no SI.",
            subject: "Física",
            university: "UP",
            year: 2022
          }
        ]
      }
    },
  })

  console.log("Semeio concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
