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
      return new NextResponse("Duelo já tratado", { status: 400 })
    }

    // Devolver o saldo para o criador
    const updatedDuel = await db.$transaction(async (tx) => {
      if (duel.betAmount > 0) {
        await tx.user.update({
          where: { id: duel.creatorId },
          data: { balance: { increment: duel.betAmount } }
        })
      }

      const d = await tx.duel.update({
        where: { id: duelId },
        data: { status: "DECLINED" }
      })

      return d
    })

    return NextResponse.json(updatedDuel)
  } catch (error) {
    console.error("[DUELS_DECLINE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
