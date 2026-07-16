import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { requireAuth } from "@/lib/api-auth"
import { debitOnce, InsufficientBalanceError } from "@/lib/balance"
import { sanitizeDuelForClient } from "@/lib/duel-finish"

export const maxDuration = 60

async function generateBatch(theme: string, count: number): Promise<unknown[]> {
  const prompt =
    "Gere exatamente " + count + " questoes de multipla escolha curtas para um Duelo academico sobre: " + theme + ". " +
    "Retorne SOMENTE um array JSON valido. " +
    "Formato obrigatorio: " +
    '[{"id":1,"question":"Enunciado curto","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Curta"}] ' +
    "Regras: correctAnswer de 0 a 3, 4 opcoes, contexto de Mocambique."

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
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const userId = session.sub
    const { opponentId, subject, betAmount, scheduledAt } = body

    if (!opponentId || !subject) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    if (opponentId === userId) {
      return new NextResponse("Não pode desafiar a si mesmo", { status: 400 })
    }

    const bet = betAmount ? parseFloat(betAmount.toString()) : 0.0
    if (!Number.isFinite(bet) || bet < 0) {
      return new NextResponse("Aposta inválida", { status: 400 })
    }

    const creator = await db.user.findUnique({ where: { id: userId } })
    if (!creator) {
      return new NextResponse("Criador não encontrado", { status: 404 })
    }
    if (creator.balance < bet) {
      return new NextResponse("Saldo insuficiente para a aposta", { status: 400 })
    }

    const opponent = await db.user.findUnique({ where: { id: opponentId } })
    if (!opponent) {
      return new NextResponse("Oponente não encontrado", { status: 404 })
    }

    const questions = await generateBatch(subject, 5)
    if (questions.length === 0) {
      return new NextResponse("Falha ao gerar perguntas", { status: 500 })
    }

    try {
      const result = await db.$transaction(async (tx) => {
        const duel = await tx.duel.create({
          data: {
            creatorId: userId,
            opponentId,
            subject,
            status: "PENDING",
            betAmount: bet,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            questions: JSON.stringify(questions),
          },
        })

        if (bet > 0) {
          await debitOnce(tx, {
            userId,
            amount: bet,
            type: "DUEL_BET",
            reference: `duel:${duel.id}:bet:creator`,
          })
        }

        return duel
      })

      return NextResponse.json(sanitizeDuelForClient(result))
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        return new NextResponse("Saldo insuficiente para a aposta", { status: 400 })
      }
      throw error
    }
  } catch (error) {
    console.error("[DUELS_CREATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
