import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const subject = searchParams.get("subject")

    if (!userId || !subject) {
      return new NextResponse("Missing fields (userId and subject are required)", { status: 400 })
    }

    // Buscar estudantes cadastrados no sistema (excluindo o usuário ativo)
    // que estudam a disciplina especificada
    const opponents = await db.user.findMany({
      where: {
        role: "STUDENT",
        id: { not: userId },
        chosenSubjects: {
          contains: subject
        }
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        reputation: true,
        balance: true
      },
      orderBy: {
        reputation: "desc"
      },
      take: 50
    })

    return NextResponse.json(opponents)
  } catch (error) {
    console.error("[DUELS_OPPONENTS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
