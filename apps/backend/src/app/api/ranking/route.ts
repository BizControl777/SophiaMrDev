import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const role = searchParams.get("role") || "STUDENT"

    // Busca os usuários pelo papel, ordenando por reputação decrescente e também por saldo como critério de desempate
    const users = await db.user.findMany({
      where: {
        role: role,
        status: "ACTIVE"
      },
      orderBy: [
        { reputation: 'desc' },
        { balance: 'desc' },
        { name: 'asc' }
      ],
      take: limit,
      select: {
        id: true,
        name: true,
        avatar: true,
        reputation: true,
        balance: true,
        role: true,
      }
    })

    return NextResponse.json({ ranking: users })
  } catch (error) {
    console.error("[RANKING_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
