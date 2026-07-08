import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")

    if (!teacherId) {
      return new NextResponse("Teacher ID required", { status: 400 })
    }

    const lessons = await db.lesson.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" }
    })

    // Parse JSON strings before returning
    const formattedLessons = lessons.map(lesson => ({
      ...lesson,
      objectives: JSON.parse(lesson.objectives || "[]"),
      materials: JSON.parse(lesson.materials || "[]")
    }))

    return NextResponse.json(formattedLessons)
  } catch (error) {
    console.error("[TEACHER_LESSONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
