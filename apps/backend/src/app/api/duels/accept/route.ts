import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, assertSelfOrAdmin } from "@/lib/api-auth"
import { debitOnce, InsufficientBalanceError } from "@/lib/balance"
import { sanitizeDuelForClient } from "@/lib/duel-finish"

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const { duelId } = body

    if (!duelId) {
      return new NextResponse("Duel ID required", { status: 400 })
    }

    const duel = await db.duel.findUnique({ where: { id: duelId } })
    if (!duel) {
      return new NextResponse("Duelo não encontrado", { status: 404 })
    }

    const forbidden = assertSelfOrAdmin(session, duel.opponentId)
    if (forbidden) return forbidden

    if (duel.status !== "PENDING") {
      return new NextResponse("Duelo já aceito, recusado ou finalizado", { status: 400 })
    }

    try {
      const updatedDuel = await db.$transaction(async (tx) => {
        const fresh = await tx.duel.findUnique({ where: { id: duelId } })
        if (!fresh || fresh.status !== "PENDING") {
          throw new Error("BAD_STATUS")
        }

        if (fresh.betAmount > 0) {
          await debitOnce(tx, {
            userId: fresh.opponentId,
            amount: fresh.betAmount,
            type: "DUEL_BET",
            reference: `duel:${fresh.id}:bet:opponent`,
          })
        }

        return tx.duel.update({
          where: { id: duelId },
          data: { status: "ACCEPTED" },
        })
      })

      return NextResponse.json(sanitizeDuelForClient(updatedDuel))
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        return new NextResponse("Saldo insuficiente para cobrir a aposta", { status: 400 })
      }
      if (error instanceof Error && error.message === "BAD_STATUS") {
        return new NextResponse("Duelo já aceito, recusado ou finalizado", { status: 400 })
      }
      throw error
    }
  } catch (error) {
    console.error("[DUELS_ACCEPT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
