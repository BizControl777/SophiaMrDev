import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return new NextResponse("Credenciais necessárias", { status: 400 })
    }

    // Buscar o usuário pelo email
    const user = await db.user.findUnique({
      where: { email },
      include: { teacherProfile: true }
    })

    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 })
    }

    // Verificar a senha (comparação direta pois não há hash neste protótipo)
    if (user.password !== password) {
      return new NextResponse("Senha incorreta", { status: 401 })
    }

    // Retornar o usuário sem a senha
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("[AUTH_LOGIN]", error)
    return new NextResponse("Erro Interno", { status: 500 })
  }
}

