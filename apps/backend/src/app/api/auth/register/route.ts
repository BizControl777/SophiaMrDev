import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { applyAuthCookie, hashPassword, signAuthToken, stripPassword } from "@/lib/auth"
import type { UserRole } from "@sophia/shared"

const ALLOWED_ROLES: UserRole[] = ["STUDENT", "TEACHER"]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      email,
      password,
      role,
      chosenSubjects,
      subject,
      bio,
      pricePerLesson,
      experience,
    } = body

    if (!name || !email || !password || !role) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return new NextResponse("Role inválido", { status: 400 })
    }

    if (typeof password !== "string" || password.length < 6) {
      return new NextResponse("A senha deve ter pelo menos 6 caracteres", { status: 400 })
    }

    if (!chosenSubjects || !Array.isArray(chosenSubjects) || chosenSubjects.length < 2) {
      return new NextResponse("Selecione pelo menos 2 disciplinas para continuar.", {
        status: 400,
      })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        chosenSubjects: JSON.stringify(chosenSubjects),
        balance: role === "STUDENT" ? 1000 : 0,
        reputation: 0,
        status: "ACTIVE",
      },
    })

    if (role === "TEACHER") {
      await db.teacherProfile.create({
        data: {
          userId: user.id,
          subject: subject || "Geral",
          bio: bio || "Olá! Sou um novo professor na SophIA.",
          pricePerLesson: pricePerLesson ? parseFloat(pricePerLesson.toString()) : 50.0,
          experience: experience || "Iniciante",
          rating: 5.0,
          specialties: JSON.stringify(chosenSubjects),
        },
      })
    }

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    })

    const res = NextResponse.json({
      token,
      user: stripPassword(user),
    })
    applyAuthCookie(res, token)
    return res
  } catch (error) {
    console.error("[REGISTER_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
