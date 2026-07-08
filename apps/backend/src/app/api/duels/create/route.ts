import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export const maxDuration = 60

async function generateBatch(theme: string, count: number): Promise<any[]> {
  const prompt =
    "Gere exatamente " + count + " questoes de multipla escolha curtas para um Duelo academico sobre: " + theme + ". " +
    "Retorne SOMENTE um array JSON valido. " +
    "Formato obrigatorio: " +
    '[{"id":1,"question":"Enunciado curto","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Curta"}] ' +
    "Regras: correctAnswer de 0 a 3, 4 opcoes, portugues de Mocambique."

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt,
  })

  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
  const arrStart = cleaned.indexOf("[")
  const arrEnd = cleaned.lastIndexOf("]")
  if (arrStart !== -1 && arrEnd !== -1) {
    return JSON.parse(cleaned.slice(arrStart, arrEnd + 1))
  }
  return []
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, opponentId, subject, betAmount, scheduledAt } = body

    if (!userId || !opponentId || !subject) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    const bet = betAmount ? parseFloat(betAmount.toString()) : 0.0

    // 1. Verificar se o criador tem saldo suficiente
    const creator = await db.user.findUnique({
      where: { id: userId }
    })

    if (!creator) {
      return new NextResponse("Criador não encontrado", { status: 404 })
    }

    if (creator.balance < bet) {
      return new NextResponse("Saldo insuficiente para a aposta", { status: 400 })
    }

    // 2. Gerar as 5 perguntas com o Groq
    const questions = await generateBatch(subject, 5)

    if (questions.length === 0) {
      return new NextResponse("Falha ao gerar perguntas", { status: 500 })
    }

    // 3. Reter saldo da aposta do criador e criar o Duelo na Base de Dados
    const result = await db.$transaction(async (tx) => {
      // Deduzir o saldo
      if (bet > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: bet } }
        })
      }

      // Criar o duelo
      const duel = await tx.duel.create({
        data: {
          creatorId: userId,
          opponentId,
          subject,
          status: "PENDING",
          betAmount: bet,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          questions: JSON.stringify(questions),
        }
      })

      return duel
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[DUELS_CREATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
