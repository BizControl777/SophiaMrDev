import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") || searchParams.get("userId")

    if (!id) {
      return new NextResponse("User ID required", { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id },
      include: { 
        teacherProfile: true,
        lessonsAsStudent: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        lessonsAsTeacher: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        achievements: true
      }
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Buscar todas as conquistas do sistema
    const allAchievements = await db.achievement.findMany()
    const unlockedIds = new Set(user.achievements.map(ua => ua.achievementId))

    const formattedAchievements = allAchievements.map(ach => ({
      name: ach.name,
      description: ach.description,
      icon: ach.icon,
      locked: !unlockedIds.has(ach.id)
    }))

    // Formatar o retorno para incluir uma lista unificada de lições dependendo do role
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      balance: user.balance,
      reputation: user.reputation,
      avatar: user.avatar,
      chosenSubjects: user.chosenSubjects,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      teacherProfile: user.teacherProfile,
      lessons: user.role === 'TEACHER' ? user.lessonsAsTeacher : user.lessonsAsStudent,
      achievementsList: formattedAchievements
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error("[USER_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
