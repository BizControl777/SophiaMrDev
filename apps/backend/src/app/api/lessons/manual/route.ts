import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const lessons = await db.lesson.findMany({
      include: {
        teacher: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Format for frontend
    const formattedLessons = lessons.map(lesson => ({
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
