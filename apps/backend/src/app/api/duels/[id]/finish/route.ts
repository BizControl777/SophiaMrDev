import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { submitDuelAnswers } from "@/lib/duel-finish"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const { id: duelId } = await params

    if (body.score !== undefined && body.answers === undefined) {
      return new NextResponse(
        "Score do cliente não é aceite. Envie answers: number[] para correção no servidor.",
        { status: 400 }
      )
    }

    return submitDuelAnswers(session, duelId, body.answers)
  } catch (error) {
    console.error("[DUEL_FINISH_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
