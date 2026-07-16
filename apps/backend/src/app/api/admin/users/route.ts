import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/api-auth"
import { stripPassword } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await requireRole(req, ["ADMIN"])
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""

    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(users.map(stripPassword))
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireRole(req, ["ADMIN"])
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const { userId, status, role } = body

    if (!userId) {
      return new NextResponse("User ID required", { status: 400 })
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...(status && { status }), // Note: status field might need to be added to schema if not exists
        ...(role && { role }),
      },
    })

    return NextResponse.json(stripPassword(updatedUser))
  } catch (error) {
    console.error("[ADMIN_USER_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
