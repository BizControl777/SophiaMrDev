import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      userId, 
      title, 
      subject, 
      score, 
      totalQuestions, 
      timeSpent, 
      results 
    } = body

    if (!userId || !title || !subject || score === undefined) {
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
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new NextResponse("User ID required", { status: 400 })
    }

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
