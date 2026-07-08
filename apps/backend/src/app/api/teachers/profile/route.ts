import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new NextResponse("User ID required", { status: 400 })
    }

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
    const body = await req.json()
    const { userId, subject, bio, experience, pricePerLesson, institution, specialties } = body

    if (!userId) {
      return new NextResponse("User ID required", { status: 400 })
    }

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
