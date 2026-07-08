import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new NextResponse("User ID required", { status: 400 })
    }

    // Buscar duelos pendentes ou aceitos que requerem ação do usuário
    const activeDuels = await db.duel.findMany({
      where: {
        OR: [
          // Duelos direcionados ao usuário (oponente) que estão aguardando aceite (PENDING)
          // ou aceitos (ACCEPTED) mas que ele ainda não jogou (opponentScore é nulo)
          {
            opponentId: userId,
            status: { in: ["PENDING", "ACCEPTED"] },
            opponentScore: null
          },
          // Duelos criados pelo usuário que foram aceitos (ACCEPTED) mas ele ainda não jogou
          {
            creatorId: userId,
            status: "ACCEPTED",
            creatorScore: null
          },
          // Duelos criados pelo usuário aguardando resposta do oponente
          {
            creatorId: userId,
            status: "PENDING"
          }
        ]
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true, reputation: true }
        },
        opponent: {
          select: { id: true, name: true, avatar: true, reputation: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json(activeDuels)
  } catch (error) {
    console.error("[DUELS_PENDING]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
