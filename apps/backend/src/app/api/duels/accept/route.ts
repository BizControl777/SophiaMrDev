import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { duelId } = body

    if (!duelId) {
      return new NextResponse("Duel ID required", { status: 400 })
    }

    const duel = await db.duel.findUnique({
      where: { id: duelId }
    })

    if (!duel) {
      return new NextResponse("Duelo não encontrado", { status: 404 })
    }

    if (duel.status !== "PENDING") {
      return new NextResponse("Duelo já aceito, recusado ou finalizado", { status: 400 })
    }

    // Buscar o oponente para checar saldo
    const opponent = await db.user.findUnique({
      where: { id: duel.opponentId }
    })

    if (!opponent) {
      return new NextResponse("Oponente não encontrado", { status: 404 })
    }

    if (opponent.balance < duel.betAmount) {
      return new NextResponse("Saldo insuficiente para cobrir a aposta", { status: 400 })
    }

    // Cobrar a aposta do desafiado e ativar o status do duelo
    const updatedDuel = await db.$transaction(async (tx) => {
      if (duel.betAmount > 0) {
        await tx.user.update({
          where: { id: duel.opponentId },
          data: { balance: { decrement: duel.betAmount } }
        })
      }

      const d = await tx.duel.update({
        where: { id: duelId },
        data: { status: "ACCEPTED" }
      })

      return d
    })

    return NextResponse.json(updatedDuel)
  } catch (error) {
    console.error("[DUELS_ACCEPT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
