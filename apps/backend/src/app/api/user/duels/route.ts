import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, resolveUserId } from "@/lib/api-auth"

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const userId = resolveUserId(session, searchParams.get("userId"))

    // Busca os duelos finalizados onde o usuário foi criador ou oponente
    const duels = await db.duel.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { opponentId: userId }
        ],
        status: "FINISHED"
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10,
      include: {
        creator: {
          select: { id: true, name: true }
        },
        opponent: {
          select: { id: true, name: true }
        }
      }
    })

    // Formatar a resposta
    const formattedDuels = duels.map(duel => {
      const isCreator = duel.creatorId === userId
      const userScore = isCreator ? duel.creatorScore : duel.opponentScore
      const oppScore = isCreator ? duel.opponentScore : duel.creatorScore
      const opponentName = isCreator ? (duel.opponent?.name || "Desconhecido") : (duel.creator?.name || "Desconhecido")

      let type: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW'
      if (userScore !== null && oppScore !== null) {
        if (userScore > oppScore) type = 'WIN'
        else if (userScore < oppScore) type = 'LOSS'
      }

      return {
        id: duel.id,
        opponentName,
        userScore,
        oppScore,
        type,
        createdAt: duel.createdAt
      }
    })

    return NextResponse.json({ duels: formattedDuels })
  } catch (error) {
    console.error("[USER_DUELS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
