import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""

    const teachers = await db.user.findMany({
      where: {
        role: "TEACHER",
        OR: [
          { name: { contains: search } },
          { teacherProfile: { subject: { contains: search } } },
        ],
      },
      include: {
        teacherProfile: true,
      },
    })

    // Mapear para o formato que o frontend espera
    const formattedTeachers = teachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      subject: teacher.teacherProfile?.subject || "N/A",
      rating: teacher.teacherProfile?.rating || 0,
      status: teacher.status === "ACTIVE" ? "online" : "offline",
      experience: teacher.teacherProfile?.experience || "N/A",
      price: teacher.teacherProfile?.pricePerLesson || 0,
      image: teacher.avatar || "",
      bio: teacher.teacherProfile?.bio || "",
      specialties: teacher.teacherProfile?.specialties?.split(",").map(s => s.trim()).filter(Boolean) || [],
      institution: teacher.teacherProfile?.institution || "UEM",
      achievements: [], 
    }))

    return NextResponse.json(formattedTeachers)
  } catch (error) {
    console.error("[TEACHERS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
