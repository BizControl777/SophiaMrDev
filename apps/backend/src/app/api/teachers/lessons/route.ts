import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, resolveUserId } from "@/lib/api-auth"

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const teacherId = resolveUserId(session, searchParams.get("teacherId"))

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
