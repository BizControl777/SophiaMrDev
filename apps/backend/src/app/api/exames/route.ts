import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const isOld = searchParams.get("isOld") === "true"
    const subject = searchParams.get("subject")
    const search = searchParams.get("search")

    const where = {
      ...(searchParams.has("isOld") ? { isOld } : {}),
      ...(search
        ? { OR: [{ title: { contains: search } }, { subject: { contains: search } }] }
        : subject
          ? { subject: { contains: subject } }
          : {})
    }

    const exams = await db.exam.findMany({
      where,
      include: { questions: true },
      orderBy: { createdAt: "desc" }
    })

    interface QuestionRow {
      id: string
      examId: string | null
      text: string
      options: string
      correctAnswer: number
      explanation: string | null
      subject: string
      topic: string | null
      difficulty: string
      university: string
      year: number
      createdAt: Date
      updatedAt: Date
    }

    const formattedExams = exams.map((exam: { questions: QuestionRow[] } & Record<string, unknown>) => ({
      ...exam,
      questions: exam.questions.map((q: QuestionRow) => {
        try {
          return {
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
          }
        } catch (e) {
          console.error(`Error parsing options for question ${q.id}:`, q.options)
          return {
            ...q,
            options: []
          }
        }
      })
    }))

    return NextResponse.json(formattedExams)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const stack = error instanceof Error ? error.stack : undefined
    console.error("[EXAMS_GET] Detailed Error:", { message, stack })
    return new NextResponse(`Internal Error: ${message}`, { status: 500 })
  }
}
