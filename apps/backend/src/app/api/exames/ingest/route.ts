import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/api-auth"

export async function POST(req: Request) {
  try {
    const session = await requireRole(req, ["ADMIN"])
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const { 
      examTitle, 
      university, 
      year, 
      subject, 
      questions // Array de { text, options, correctAnswer, explanation, topic }
    } = body

    if (!examTitle || !university || !year || !subject || !questions) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    // Criar o registro do Exame
    const exam = await db.exam.upsert({
      where: { id: `${university.toLowerCase()}-${year}-${subject.toLowerCase()}`.replace(/\s+/g, '-') },
      update: {},
      create: {
        id: `${university.toLowerCase()}-${year}-${subject.toLowerCase()}`.replace(/\s+/g, '-'),
        title: examTitle,
        institution: university,
        year,
        subject,
        isOld: true
      }
    })

    // Inserir as questões
    const createdQuestions = await Promise.all(
      questions.map((q: any) => 
        db.question.create({
          data: {
            examId: exam.id,
            text: q.text,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            subject,
            topic: q.topic,
            university,
            year,
            difficulty: q.difficulty || "médio"
          }
        })
      )
    )

    return NextResponse.json({
      message: "Ingestion complete",
      examId: exam.id,
      questionsCount: createdQuestions.length
    })
  } catch (error) {
    console.error("[INGEST_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
