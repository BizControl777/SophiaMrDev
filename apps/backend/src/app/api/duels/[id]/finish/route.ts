import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json()
    const { userId, score } = body
    const resolvedParams = await params
    const duelId = resolvedParams.id

    if (!userId || score === undefined) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    const points = parseInt(score.toString(), 10)

    // Buscar o duelo existente
    const duel = await db.duel.findUnique({
      where: { id: duelId },
      include: {
        creator: true,
        opponent: true
      }
    })

    if (!duel) {
      return new NextResponse("Duelo não encontrado", { status: 404 })
    }

    let updatedDuel;
    let finished = false;
    let winnerId: string | null = null;
    let isDraw = false;

    // Atualizar o score de quem terminou de jogar
    const dataToUpdate: any = {}
    if (duel.creatorId === userId) {
      dataToUpdate.creatorScore = points
    } else if (duel.opponentId === userId) {
      dataToUpdate.opponentScore = points
    } else {
      return new NextResponse("Usuário não faz parte deste duelo", { status: 403 })
    }

    // Verificar se com essa atualização o duelo finaliza
    const currentCreatorScore = duel.creatorId === userId ? points : duel.creatorScore
    const currentOpponentScore = duel.opponentId === userId ? points : duel.opponentScore

    if (currentCreatorScore !== null && currentOpponentScore !== null) {
      finished = true
      dataToUpdate.status = "FINISHED"
      
      if (currentCreatorScore > currentOpponentScore) {
        winnerId = duel.creatorId
      } else if (currentOpponentScore > currentCreatorScore) {
        winnerId = duel.opponentId
      } else {
        isDraw = true
      }
    }

    // Rodar em transação para garantir integridade financeira
    updatedDuel = await db.$transaction(async (tx) => {
      // 1. Atualizar o duelo
      const d = await tx.duel.update({
        where: { id: duelId },
        data: dataToUpdate
      })

      // 2. Se o duelo acabou, distribuir prêmios/reputações e devoluções
      if (finished) {
        const bet = duel.betAmount

        if (isDraw) {
          // Empate: devolve a aposta para cada um
          if (bet > 0) {
            await tx.user.update({
              where: { id: duel.creatorId },
              data: { 
                balance: { increment: bet },
                reputation: { increment: 5 }
              }
            })
            await tx.user.update({
              where: { id: duel.opponentId },
              data: { 
                balance: { increment: bet },
                reputation: { increment: 5 }
              }
            })
          } else {
            await tx.user.update({ where: { id: duel.creatorId }, data: { reputation: { increment: 5 } } })
            await tx.user.update({ where: { id: duel.opponentId }, data: { reputation: { increment: 5 } } })
          }
        } else {
          // Um vencedor
          const prize = bet * 2
          const loserId = winnerId === duel.creatorId ? duel.opponentId : duel.creatorId

          // Dar o prêmio ao vencedor
          await tx.user.update({
            where: { id: winnerId! },
            data: { 
              balance: { increment: prize },
              reputation: { increment: 25 }
            }
          })

          // Deduzir reputação do perdedor (garantindo que não seja menor que 0)
          const loser = await tx.user.findUnique({ where: { id: loserId } })
          if (loser) {
            await tx.user.update({
              where: { id: loserId },
              data: { reputation: Math.max(0, loser.reputation - 10) }
            })
          }
        }
      }

      return d
    })

    return NextResponse.json({ success: true, duel: updatedDuel, finished, winnerId, isDraw })
  } catch (error) {
    console.error("[DUEL_FINISH_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
