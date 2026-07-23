import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const studentId = session.sub
    const { lessonRequestId, rating, comment } = body

    if (!lessonRequestId || rating === undefined) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    const ratingNum = typeof rating === "number" ? rating : parseInt(rating, 10)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return new NextResponse("Rating deve ser um inteiro entre 1 e 5", { status: 400 })
    }

    const lesson = await db.lessonRequest.findUnique({
      where: { id: lessonRequestId },
    })
    if (!lesson) {
      return new NextResponse("Aula não encontrada", { status: 404 })
    }
    if (lesson.studentId !== studentId) {
      return new NextResponse("Apenas o aluno desta aula pode avaliar", { status: 403 })
    }
    if (lesson.status !== "COMPLETED") {
      return new NextResponse("Só é possível avaliar após a aula estar concluída", { status: 400 })
    }

    const existingReview = await db.lessonReview.findUnique({
      where: { lessonRequestId },
    })
    if (existingReview) {
      return new NextResponse("Review already exists", { status: 400 })
    }

    const teacherId = lesson.teacherId

    const review = await db.lessonReview.create({
      data: {
        lessonRequestId,
        studentId,
        teacherId,
        rating: ratingNum,
        comment: typeof comment === "string" ? comment : null,
      },
    })

    const teacherReviews = await db.lessonReview.findMany({
      where: { teacherId },
    })

    const totalRating = teacherReviews.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0)
    const averageRating = totalRating / teacherReviews.length

    await db.teacherProfile.update({
      where: { userId: teacherId },
      data: { rating: averageRating },
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error("[REVIEWS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
