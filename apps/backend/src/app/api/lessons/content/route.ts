import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { teacherId, title, subject, description, objectives, materials } = body

    if (!teacherId || !title || !subject) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    const lesson = await db.lesson.create({
      data: {
        teacherId,
        title,
        subject,
        description,
        objectives: JSON.stringify(objectives),
        materials: JSON.stringify(materials),
      }
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error("[LESSONS_CONTENT_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")
    const subject = searchParams.get("subject")

    const lessons = await db.lesson.findMany({
      where: {
        ...(teacherId && { teacherId }),
        ...(subject && { subject: { contains: subject } }),
      },
      include: {
        teacher: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error("[LESSONS_CONTENT_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get("id")

    if (!lessonId) {
      return new NextResponse("Lesson ID required", { status: 400 })
    }

    await db.lesson.delete({
      where: { id: lessonId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[LESSONS_CONTENT_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
