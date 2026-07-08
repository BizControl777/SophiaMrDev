const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function check() {
  const users = await prisma.user.findMany({ select: { email: true, password: true, role: true } })
  console.log("USERS:", users)
}
check().finally(() => prisma.$disconnect())
