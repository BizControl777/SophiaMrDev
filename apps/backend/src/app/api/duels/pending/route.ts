import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, resolveUserId } from "@/lib/api-auth"
import { sanitizeDuelForClient } from "@/lib/duel-finish"

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const userId = resolveUserId(session, searchParams.get("userId"))

    const activeDuels = await db.duel.findMany({
      where: {
        OR: [
          {
            opponentId: userId,
            status: { in: ["PENDING", "ACCEPTED"] },
            opponentScore: null,
          },
          {
            creatorId: userId,
            status: "ACCEPTED",
            creatorScore: null,
          },
          {
            creatorId: userId,
            status: "PENDING",
          },
        ],
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true, reputation: true },
        },
        opponent: {
          select: { id: true, name: true, avatar: true, reputation: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json(activeDuels.map(sanitizeDuelForClient))
  } catch (error) {
    console.error("[DUELS_PENDING]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
