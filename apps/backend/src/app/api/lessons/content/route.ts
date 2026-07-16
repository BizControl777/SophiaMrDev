import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, assertSelfOrAdmin } from "@/lib/api-auth"
import { stripPassword } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const teacherId = session.sub
    const { title, subject, description, objectives, materials } = body

    if (!title || !subject) {
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
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")
    const subject = searchParams.get("subject")

    const lessons = await db.lesson.findMany({
      where: {
        ...(teacherId && { teacherId }),
        ...(subject && { subject: { contains: subject } }),
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            reputation: true,
            role: true,
            teacherProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error("[LESSONS_CONTENT_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get("id")

    if (!lessonId) {
      return new NextResponse("Lesson ID required", { status: 400 })
    }

    const lesson = await db.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson) {
      return new NextResponse("Lesson not found", { status: 404 })
    }

    const forbidden = assertSelfOrAdmin(session, lesson.teacherId)
    if (forbidden) return forbidden

    await db.lesson.delete({
      where: { id: lessonId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[LESSONS_CONTENT_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
