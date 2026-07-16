import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  applyAuthCookie,
  hashPassword,
  isBcryptHash,
  signAuthToken,
  stripPassword,
  verifyPassword,
} from "@/lib/auth"
import type { UserRole } from "@sophia/shared"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return new NextResponse("Credenciais necessárias", { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { teacherProfile: true },
    })

    if (!user) {
      return new NextResponse("Credenciais inválidas", { status: 401 })
    }

    if (user.status !== "ACTIVE") {
      return new NextResponse("Conta suspensa ou inativa", { status: 403 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return new NextResponse("Credenciais inválidas", { status: 401 })
    }

    // Migrate legacy plaintext passwords to bcrypt on successful login
    if (!isBcryptHash(user.password)) {
      const hashed = await hashPassword(password)
      await db.user.update({
        where: { id: user.id },
        data: { password: hashed },
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
    console.error("[AUTH_LOGIN]", error)
    return new NextResponse("Erro Interno", { status: 500 })
  }
}
