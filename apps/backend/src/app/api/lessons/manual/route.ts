import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const lessons = await db.lesson.findMany({
      include: {
        teacher: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Format for frontend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedLessons = lessons.map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      subject: lesson.subject,
      description: lesson.description,
      teacher: lesson.teacher.name,
      duration: "N/A", 
      objectives: JSON.parse(lesson.objectives),
      materials: JSON.parse(lesson.materials)
    }))

    return NextResponse.json(formattedLessons)
  } catch (error) {
    console.error("[MANUAL_LESSONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
