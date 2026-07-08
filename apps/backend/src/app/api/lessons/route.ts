import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { studentId, teacherId, subject, description, price, date } = body

    if (!studentId || !teacherId || !subject || !price) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    // Verificar saldo do aluno
    const student = await db.user.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return new NextResponse("Student not found", { status: 404 })
    }

    if (student.balance < price) {
      return new NextResponse("Insufficient balance", { status: 400 })
    }

    // Criar a solicitação
    const lessonRequest = await db.lessonRequest.create({
      data: {
        studentId,
        teacherId,
        subject,
        description,
        price,
        date: date ? new Date(date) : new Date(),
        status: "PENDING",
      }
    })

    // Debitar o saldo do aluno (retenção de segurança)
    await db.user.update({
      where: { id: studentId },
      data: {
        balance: student.balance - price
      }
    })

    return NextResponse.json(lessonRequest)
  } catch (error) {
    console.error("[LESSONS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const role = searchParams.get("role")

    if (!userId) {
      return new NextResponse("User ID required", { status: 400 })
    }

    let lessons
    if (role === "TEACHER") {
      lessons = await db.lessonRequest.findMany({
        where: { teacherId: userId },
        include: { student: true },
        orderBy: { createdAt: "desc" }
      })
    } else {
      lessons = await db.lessonRequest.findMany({
        where: { studentId: userId },
        include: { 
          teacher: { 
            include: { teacherProfile: true } 
          },
          review: true
        },
        orderBy: { createdAt: "desc" }
      })
      // Formatar para o estudante
      lessons = lessons.map(lesson => ({
        ...lesson,
        teacherName: lesson.teacher.name,
        // Mantemos a data original do agendamento em vez de substituir pelo createdAt
      }))
    }

    return NextResponse.json(lessons)
  } catch (error) {
    console.error("[LESSONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { lessonId, status, materials, newMessage } = body

    if (!lessonId) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    const lesson = await db.lessonRequest.findUnique({
      where: { id: lessonId },
      include: { teacher: true }
    })

    if (!lesson) {
      return new NextResponse("Lesson not found", { status: 404 })
    }

    let updatedChatMessages = lesson.chatMessages;
    if (newMessage) {
      const currentMessages = lesson.chatMessages ? JSON.parse(lesson.chatMessages) : [];
      currentMessages.push({ ...newMessage, id: crypto.randomUUID(), timestamp: new Date().toISOString() });
      updatedChatMessages = JSON.stringify(currentMessages);
    }

    const updatedLesson = await db.lessonRequest.update({
      where: { id: lessonId },
      data: { 
        status: status || lesson.status,
        materials: materials ? JSON.stringify(materials) : lesson.materials,
        chatMessages: updatedChatMessages
      }
    })

    if (status) {
      // Se a aula for cancelada ou rejeitada, o dinheiro volta para o aluno.
      if (status === "REJECTED" || status === "CANCELLED") {
        const student = await db.user.findUnique({
          where: { id: lesson.studentId }
        })

        if (student) {
          await db.user.update({
            where: { id: student.id },
            data: {
              balance: student.balance + lesson.price
            }
          })
        }
      }

      // Se for concluída (COMPLETED), o dinheiro vai para o professor.
      if (status === "COMPLETED") {
        const teacher = await db.user.findUnique({
          where: { id: lesson.teacherId }
        })

        if (teacher) {
          await db.user.update({
            where: { id: teacher.id },
            data: {
              balance: teacher.balance + lesson.price
            }
          })
        }
      }
    }

    return NextResponse.json(updatedLesson)
  } catch (error) {
    console.error("[LESSONS_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
