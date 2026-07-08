import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { lessonRequestId, studentId, teacherId, rating, comment } = body

    if (!lessonRequestId || !studentId || !teacherId || rating === undefined) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    // Verifica se já existe avaliação
    const existingReview = await db.lessonReview.findUnique({
      where: { lessonRequestId }
    })

    if (existingReview) {
      return new NextResponse("Review already exists", { status: 400 })
    }

    // Cria a avaliação
    const review = await db.lessonReview.create({
      data: {
        lessonRequestId,
        studentId,
        teacherId,
        rating,
        comment
      }
    })

    // Atualiza o rating médio do professor
    const teacherReviews = await db.lessonReview.findMany({
      where: { teacherId }
    })

    const totalRating = teacherReviews.reduce((acc, curr) => acc + curr.rating, 0)
    const averageRating = totalRating / teacherReviews.length

    await db.teacherProfile.update({
      where: { userId: teacherId },
      data: {
        rating: averageRating
      }
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error("[REVIEWS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
