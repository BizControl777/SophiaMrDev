import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, requireRole, resolveUserId, assertSelfOrAdmin } from "@/lib/api-auth"

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const userId = resolveUserId(session, searchParams.get("userId"))

    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId }
    })

    const completedLessonsCount = await db.lessonRequest.count({
      where: { 
        teacherId: userId,
        status: "COMPLETED"
      }
    })

    return NextResponse.json({
      profile: teacherProfile,
      metrics: {
        completedLessons: completedLessonsCount
      }
    })
  } catch (error) {
    console.error("[TEACHER_PROFILE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireRole(req, ["TEACHER", "ADMIN"])
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const { subject, bio, experience, pricePerLesson, institution, specialties } = body
    const userId = resolveUserId(session, body.userId)

    const forbidden = assertSelfOrAdmin(session, userId)
    if (forbidden) return forbidden

    // Upsert to ensure if it doesn't exist, we create it.
    const updatedProfile = await db.teacherProfile.upsert({
      where: { userId },
      update: {
        subject,
        bio,
        experience,
        pricePerLesson: Number(pricePerLesson),
        institution,
        specialties
      },
      create: {
        userId,
        subject,
        bio,
        experience,
        pricePerLesson: Number(pricePerLesson),
        institution,
        specialties,
        rating: 5.0
      }
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error("[TEACHER_PROFILE_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
