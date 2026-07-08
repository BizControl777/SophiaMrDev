const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  await prisma.message.deleteMany({})
  await prisma.chat.deleteMany({})
  await prisma.duel.deleteMany({})
  await prisma.simulation.deleteMany({})
  await prisma.lessonReview.deleteMany({})
  await prisma.lessonRequest.deleteMany({})
  await prisma.lesson.deleteMany({})
  await prisma.teacherProfile.deleteMany({})
  await prisma.question.deleteMany({})
  await prisma.exam.deleteMany({})
  await prisma.userAchievement.deleteMany({})
  await prisma.achievement.deleteMany({})
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
      bio: "Especialista em Cálculo e Geometria Analítica.",
      experience: "15 anos",
      pricePerLesson: 1500.00,
      institution: "UEM",
      specialties: "Cálculo",
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
      bio: "Doutorada em Física Teórica.",
      experience: "10 anos",
      pricePerLesson: 2000.00,
      institution: "UP",
      specialties: "Mecânica",
      rating: 4.8,
    },
  })

  // Criar as Conquistas Oficiais do Aluno
  const ach1 = await prisma.achievement.create({ data: { name: "Pioneiro", description: "Concedido aos primeiros estudantes da SophIA", icon: "🚀" } })
  const ach2 = await prisma.achievement.create({ data: { name: "Cérebro IA", description: "Tire dúvidas e estude com o tutor IA SophIA", icon: "🧠" } })
  const ach3 = await prisma.achievement.create({ data: { name: "Duelo Invicto", description: "Vença um duelo na Arena sem errar nenhuma questão", icon: "⚔️" } })
  const ach4 = await prisma.achievement.create({ data: { name: "Mentor Bronze", description: "Ajude colegas ou coopere ativamente com a comunidade", icon: "🥉" } })

  // Pré-desbloquear algumas conquistas para o estudante António Kumbe (Pioneiro e Cérebro IA)
  await prisma.userAchievement.createMany({
    data: [
      { userId: student.id, achievementId: ach1.id },
      { userId: student.id, achievementId: ach2.id },
    ]
  })

  console.log("Semeio de usuários e conquistas concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
