import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, resolveUserId } from "@/lib/api-auth"

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const userId = session.sub
    const { 
      title, 
      subject, 
      score, 
      totalQuestions, 
      timeSpent, 
      results 
    } = body

    if (!title || !subject || score === undefined) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    const simulation = await db.simulation.create({
      data: {
        userId,
        title,
        subject,
        score,
        totalQuestions,
        timeSpent,
        results: JSON.stringify(results)
      }
    })

    return NextResponse.json(simulation)
  } catch (error) {
    console.error("[SIMULATIONS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const userId = resolveUserId(session, searchParams.get("userId"))

    const simulations = await db.simulation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(simulations)
  } catch (error) {
    console.error("[SIMULATIONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
