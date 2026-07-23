import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/api-auth"

export async function GET(req: Request) {
  try {
    const session = await requireRole(req, ["ADMIN"])
    if (session instanceof NextResponse) return session

    const now = new Date()
    const expiryLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 horas atrás

    // Buscar duelos que expiraram (agendados no passado ou criados há mais de 24h e não concluídos)
    const expiredDuels = await db.duel.findMany({
      where: {
        status: { in: ["PENDING", "ACCEPTED"] },
        OR: [
          { scheduledAt: { lt: now } },
          { createdAt: { lt: expiryLimit } }
        ]
      }
    })

    let count = 0
    for (const duel of expiredDuels) {
      await db.$transaction(async (tx: Prisma.TransactionClient) => {
        // Devolver saldo do criador
        if (duel.betAmount > 0) {
          await tx.user.update({
            where: { id: duel.creatorId },
            data: { balance: { increment: duel.betAmount } }
          })

          // Se já havia sido aceito (ACCEPTED), devolver também ao oponente
          if (duel.status === "ACCEPTED") {
            await tx.user.update({
              where: { id: duel.opponentId },
              data: { balance: { increment: duel.betAmount } }
            })
          }
        }

        // Marcar como EXPIRED
        await tx.duel.update({
          where: { id: duel.id },
          data: { status: "EXPIRED" }
        })
      })
      count++
    }

    return NextResponse.json({ success: true, expiredCleaned: count })
  } catch (error) {
    console.error("[DUELS_CLEANUP]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
