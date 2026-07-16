import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { submitDuelAnswers } from "@/lib/duel-finish"

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const { duelId, answers } = body

    if (!duelId) {
      return new NextResponse("duelId obrigatório", { status: 400 })
    }

    if (body.score !== undefined && answers === undefined) {
      return new NextResponse(
        "Score do cliente não é aceite. Envie answers: number[] para correção no servidor.",
        { status: 400 }
      )
    }

    return submitDuelAnswers(session, duelId, answers)
  } catch (error) {
    console.error("[DUEL_FINISH_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
