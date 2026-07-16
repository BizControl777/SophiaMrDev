import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, assertSelfOrAdmin } from "@/lib/api-auth"
import { applyBalanceOnce } from "@/lib/balance"
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
      return new NextResponse("Duelo já tratado", { status: 400 })
    }

    const updatedDuel = await db.$transaction(async (tx) => {
      const fresh = await tx.duel.findUnique({ where: { id: duelId } })
      if (!fresh || fresh.status !== "PENDING") {
        throw new Error("BAD_STATUS")
      }

      if (fresh.betAmount > 0) {
        await applyBalanceOnce(tx, {
          userId: fresh.creatorId,
          amount: fresh.betAmount,
          type: "DUEL_REFUND",
          reference: `duel:${fresh.id}:refund:creator-decline`,
        })
      }

      return tx.duel.update({
        where: { id: duelId },
        data: { status: "DECLINED" },
      })
    })

    return NextResponse.json(sanitizeDuelForClient(updatedDuel))
  } catch (error) {
    if (error instanceof Error && error.message === "BAD_STATUS") {
      return new NextResponse("Duelo já tratado", { status: 400 })
    }
    console.error("[DUELS_DECLINE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
