import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, resolveUserId } from "@/lib/api-auth"
import { debitOnce, applyBalanceOnce, InsufficientBalanceError } from "@/lib/balance"
import { stripPassword } from "@/lib/auth"

const TERMINAL = new Set(["COMPLETED", "REJECTED", "CANCELLED"])

type LessonStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED"

function canTransition(
  from: string,
  to: LessonStatus,
  actor: "student" | "teacher" | "admin"
): boolean {
  if (from === to) return true
  if (TERMINAL.has(from)) return false

  if (to === "ACCEPTED") {
    return from === "PENDING" && (actor === "teacher" || actor === "admin")
  }
  if (to === "REJECTED") {
    return from === "PENDING" && (actor === "teacher" || actor === "admin")
  }
  if (to === "CANCELLED") {
    return (
      (from === "PENDING" || from === "ACCEPTED") &&
      (actor === "student" || actor === "teacher" || actor === "admin")
    )
  }
  // Payout only after student (or admin) confirms completion — not teacher alone
  if (to === "COMPLETED") {
    return from === "ACCEPTED" && (actor === "student" || actor === "admin")
  }
  return false
}

function sanitizeLesson<T extends Record<string, unknown>>(lesson: T): T {
  const out = { ...lesson }
  if (out.student && typeof out.student === "object" && out.student !== null) {
    out.student = stripPassword(out.student as { password?: string })
  }
  if (out.teacher && typeof out.teacher === "object" && out.teacher !== null) {
    out.teacher = stripPassword(out.teacher as { password?: string })
  }
  return out
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const studentId = session.sub
    const { teacherId, subject, description, date } = body

    if (!teacherId || !subject) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    if (teacherId === studentId) {
      return new NextResponse("Não pode solicitar aula a si mesmo", { status: 400 })
    }

    const teacher = await db.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true },
    })
    if (!teacher || teacher.role !== "TEACHER" || !teacher.teacherProfile) {
      return new NextResponse("Professor não encontrado", { status: 404 })
    }
    if (teacher.status !== "ACTIVE") {
      return new NextResponse("Professor indisponível", { status: 400 })
    }

    const amount = teacher.teacherProfile.pricePerLesson
    if (!Number.isFinite(amount) || amount <= 0) {
      return new NextResponse("Preço do professor inválido", { status: 400 })
    }

    try {
      const lessonRequest = await db.$transaction(async (tx) => {
        const lesson = await tx.lessonRequest.create({
          data: {
            studentId,
            teacherId,
            subject,
            description,
            price: amount,
            date: date ? new Date(date) : new Date(),
            status: "PENDING",
          },
        })

        await debitOnce(tx, {
          userId: studentId,
          amount,
          type: "LESSON_HOLD",
          reference: `lesson:${lesson.id}:hold`,
        })

        return lesson
      })

      return NextResponse.json(lessonRequest)
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        return new NextResponse("Insufficient balance", { status: 400 })
      }
      throw error
    }
  } catch (error) {
    console.error("[LESSONS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const userId = resolveUserId(session, searchParams.get("userId"))
    const role = searchParams.get("role")

    let lessons
    if (role === "TEACHER") {
      lessons = await db.lessonRequest.findMany({
        where: { teacherId: userId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              reputation: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    } else {
      lessons = await db.lessonRequest.findMany({
        where: { studentId: userId },
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
          review: true,
        },
        orderBy: { createdAt: "desc" },
      })
      lessons = lessons.map((lesson) => ({
        ...lesson,
        teacherName: lesson.teacher.name,
      }))
    }

    return NextResponse.json(lessons.map((l) => sanitizeLesson(l as Record<string, unknown>)))
  } catch (error) {
    console.error("[LESSONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const { lessonId, status, materials, newMessage } = body

    if (!lessonId) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    const lesson = await db.lessonRequest.findUnique({ where: { id: lessonId } })
    if (!lesson) {
      return new NextResponse("Lesson not found", { status: 404 })
    }

    const isStudent = session.sub === lesson.studentId
    const isTeacher = session.sub === lesson.teacherId
    const isAdmin = session.role === "ADMIN"

    if (!isStudent && !isTeacher && !isAdmin) {
      return new NextResponse("Acesso negado", { status: 403 })
    }

    const actor: "student" | "teacher" | "admin" = isAdmin
      ? "admin"
      : isTeacher
        ? "teacher"
        : "student"

    const nextStatus = status as LessonStatus | undefined
    if (nextStatus && !canTransition(lesson.status, nextStatus, actor)) {
      return new NextResponse(
        `Transição inválida: ${lesson.status} → ${nextStatus} (${actor})`,
        { status: 400 }
      )
    }

    if (materials && actor !== "teacher" && actor !== "admin") {
      return new NextResponse("Apenas o professor pode anexar materiais", { status: 403 })
    }

    let updatedChatMessages = lesson.chatMessages
    if (newMessage) {
      const currentMessages = lesson.chatMessages ? JSON.parse(lesson.chatMessages) : []
      currentMessages.push({
        ...newMessage,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        senderId: session.sub,
      })
      updatedChatMessages = JSON.stringify(currentMessages)
    }

    const updatedLesson = await db.$transaction(async (tx) => {
      const fresh = await tx.lessonRequest.findUnique({ where: { id: lessonId } })
      if (!fresh) throw new Error("MISSING")

      if (nextStatus && !canTransition(fresh.status, nextStatus, actor)) {
        throw new Error("BAD_TRANSITION")
      }

      const updated = await tx.lessonRequest.update({
        where: { id: lessonId },
        data: {
          status: nextStatus || fresh.status,
          materials: materials ? JSON.stringify(materials) : fresh.materials,
          chatMessages: updatedChatMessages,
        },
      })

      if (nextStatus && nextStatus !== fresh.status) {
        if (nextStatus === "REJECTED" || nextStatus === "CANCELLED") {
          await applyBalanceOnce(tx, {
            userId: fresh.studentId,
            amount: fresh.price,
            type: "LESSON_REFUND",
            reference: `lesson:${fresh.id}:refund`,
          })
        }

        if (nextStatus === "COMPLETED") {
          await applyBalanceOnce(tx, {
            userId: fresh.teacherId,
            amount: fresh.price,
            type: "LESSON_PAYOUT",
            reference: `lesson:${fresh.id}:payout`,
          })
        }
      }

      return updated
    })

    return NextResponse.json(updatedLesson)
  } catch (error) {
    if (error instanceof Error && error.message === "BAD_TRANSITION") {
      return new NextResponse("Transição de estado inválida", { status: 400 })
    }
    console.error("[LESSONS_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
