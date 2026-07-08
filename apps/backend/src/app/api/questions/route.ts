import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      text, 
      options, 
      correctAnswer, 
      explanation, 
      subject, 
      topic, 
      difficulty, 
      university, 
      year,
      examId 
    } = body

    if (!text || !options || correctAnswer === undefined || !subject) {
      return new NextResponse("Campos obrigatórios ausentes", { status: 400 })
    }

    const question = await db.question.create({
      data: {
        text,
        options: JSON.stringify(options),
        correctAnswer,
        explanation,
        subject,
        topic,
        difficulty: difficulty || "médio",
        university: university || "SophIA Labs",
        year: year || new Date().getFullYear(),
        examId: examId || null
      }
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error("[QUESTIONS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get("subject")
    
    const questions = await db.question.findMany({
      where: {
        ...(subject && { subject: { contains: subject } })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    const formattedQuestions = questions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }))

    return NextResponse.json(formattedQuestions)
  } catch (error) {
    console.error("[QUESTIONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
