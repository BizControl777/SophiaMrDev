import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const isOld = searchParams.get("isOld") === "true"
    const subject = searchParams.get("subject")
    const search = searchParams.get("search")

    const where: any = {}
    if (searchParams.has("isOld")) {
      where.isOld = isOld
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { subject: { contains: search } }
      ]
    } else if (subject) {
      where.subject = { contains: subject }
    }

    const exams = await db.exam.findMany({
      where,
      include: { questions: true },
      orderBy: { createdAt: "desc" }
    })

    const formattedExams = exams.map(exam => ({
      ...exam,
      questions: exam.questions.map(q => {
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
  } catch (error: any) {
    console.error("[EXAMS_GET] Detailed Error:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    })
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
  }
}
