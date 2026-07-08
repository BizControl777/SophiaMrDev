import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, role, chosenSubjects, subject, bio, pricePerLesson, experience } = body

    if (!name || !email || !password || !role) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    // Validar no mínimo 2 disciplinas
    if (!chosenSubjects || !Array.isArray(chosenSubjects) || chosenSubjects.length < 2) {
      return new NextResponse("Selecione pelo menos 2 disciplinas para continuar.", { status: 400 })
    }

    // Verificar se o usuário já existe
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 })
    }

    // Criar o novo usuário
    // Nota: Em uma app real, a senha DEVE ser hasheada (ex: bcrypt)
    const user = await db.user.create({
      data: {
        name,
        email,
        password,
        role,
        chosenSubjects: chosenSubjects ? JSON.stringify(chosenSubjects) : null,
        balance: role === 'STUDENT' ? 1000 : 0, // Bônus inicial para alunos
        reputation: 0,
        status: "online"
      }
    })

    // Se for professor, criar o perfil de professor com os dados informados
    if (role === 'TEACHER') {
      await db.teacherProfile.create({
        data: {
          userId: user.id,
          subject: subject || "Geral",
          bio: bio || "Olá! Sou um novo professor na SophIA.",
          pricePerLesson: pricePerLesson ? parseFloat(pricePerLesson.toString()) : 50.0,
          experience: experience || "Iniciante",
          rating: 5.0,
          specialties: chosenSubjects ? JSON.stringify(chosenSubjects) : JSON.stringify(["Educação"])
        }
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[REGISTER_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
