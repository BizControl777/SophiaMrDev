import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { applyBalanceOnce } from "@/lib/balance"
import type { AuthSession } from "@/lib/api-auth"

type DuelQuestion = {
  correctAnswer: number
  question?: string
  options?: string[]
  id?: number
}

export function stripQuestionAnswers(questionsJson: string): unknown[] {
  try {
    const parsed = JSON.parse(questionsJson)
    if (!Array.isArray(parsed)) return []
    return parsed.map((q: Record<string, unknown>) => {
      const { correctAnswer: _, explanation: __, ...safe } = q
      return safe
    })
  } catch {
    return []
  }
}

/** Never leak correctAnswer/explanation until the duel is FINISHED. */
export function sanitizeDuelForClient<T extends { questions: string; status: string }>(
  duel: T
): T {
  if (duel.status === "FINISHED") return duel
  return {
    ...duel,
    questions: JSON.stringify(stripQuestionAnswers(duel.questions)),
  }
}

function scoreAnswers(questions: DuelQuestion[], answers: number[]): number | null {
  if (answers.length !== questions.length) return null
  let score = 0
  for (let i = 0; i < questions.length; i++) {
    const a = answers[i]
    if (typeof a !== "number" || !Number.isInteger(a)) return null
    if (a === questions[i].correctAnswer) score++
  }
  return score
}

async function settleDuelPrizes(
  tx: Prisma.TransactionClient,
  duel: {
    id: string
    betAmount: number
    creatorId: string
    opponentId: string
  },
  winnerId: string | null,
  isDraw: boolean
) {
  const bet = duel.betAmount
  if (bet <= 0) return

  if (isDraw) {
    await applyBalanceOnce(tx, {
      userId: duel.creatorId,
      amount: bet,
      type: "DUEL_REFUND",
      reference: `duel:${duel.id}:refund:creator`,
    })
    await applyBalanceOnce(tx, {
      userId: duel.opponentId,
      amount: bet,
      type: "DUEL_REFUND",
      reference: `duel:${duel.id}:refund:opponent`,
    })
    return
  }

  if (!winnerId) return

  await applyBalanceOnce(tx, {
    userId: winnerId,
    amount: bet * 2,
    type: "DUEL_PRIZE",
    reference: `duel:${duel.id}:prize`,
  })
}

/**
 * Submit answers for the current user. Score is computed server-side.
 * Prize settlement runs at most once (status FINISHED + ledger references).
 */
export async function submitDuelAnswers(
  session: AuthSession,
  duelId: string,
  answers: unknown
): Promise<NextResponse> {
  if (!Array.isArray(answers) || !answers.every((a) => typeof a === "number")) {
    return new NextResponse("Envie answers: number[] com as opções escolhidas", {
      status: 400,
    })
  }

  const duel = await db.duel.findUnique({ where: { id: duelId } })
  if (!duel) {
    return new NextResponse("Duelo não encontrado", { status: 404 })
  }

  if (duel.status === "FINISHED") {
    return NextResponse.json({
      success: true,
      duel: sanitizeDuelForClient(duel),
      finished: true,
      winnerId:
        duel.creatorScore !== null &&
        duel.opponentScore !== null &&
        duel.creatorScore !== duel.opponentScore
          ? duel.creatorScore > duel.opponentScore
            ? duel.creatorId
            : duel.opponentId
          : null,
      isDraw:
        duel.creatorScore !== null &&
        duel.opponentScore !== null &&
        duel.creatorScore === duel.opponentScore,
      alreadyFinished: true,
    })
  }

  if (duel.status !== "ACCEPTED") {
    return new NextResponse("Duelo não está em andamento", { status: 400 })
  }

  const isCreator = session.sub === duel.creatorId
  const isOpponent = session.sub === duel.opponentId
  if (!isCreator && !isOpponent) {
    return new NextResponse("Usuário não faz parte deste duelo", { status: 403 })
  }

  if ((isCreator && duel.creatorScore !== null) || (isOpponent && duel.opponentScore !== null)) {
    return NextResponse.json({
      success: true,
      duel: sanitizeDuelForClient(duel),
      finished: false,
      alreadySubmitted: true,
    })
  }

  let questions: DuelQuestion[]
  try {
    questions = JSON.parse(duel.questions)
  } catch {
    return new NextResponse("Perguntas do duelo inválidas", { status: 500 })
  }

  const points = scoreAnswers(questions, answers as number[])
  if (points === null) {
    return new NextResponse(
      `Número de respostas inválido (esperado ${questions.length})`,
      { status: 400 }
    )
  }

  const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const fresh = await tx.duel.findUnique({ where: { id: duelId } })
    if (!fresh) throw new Error("MISSING_DUEL")
    if (fresh.status === "FINISHED") {
      return { duel: fresh, finished: true, winnerId: null as string | null, isDraw: false, skipped: true }
    }
    if (fresh.status !== "ACCEPTED") {
      throw new Error("BAD_STATUS")
    }
    if (
      (isCreator && fresh.creatorScore !== null) ||
      (isOpponent && fresh.opponentScore !== null)
    ) {
      return { duel: fresh, finished: false, winnerId: null as string | null, isDraw: false, skipped: true }
    }

    const creatorScore = isCreator ? points : fresh.creatorScore
    const opponentScore = isOpponent ? points : fresh.opponentScore
    let finished = false
    let winnerId: string | null = null
    let isDraw = false
    const data: {
      creatorScore?: number
      opponentScore?: number
      status?: string
    } = isCreator ? { creatorScore: points } : { opponentScore: points }

    if (creatorScore !== null && opponentScore !== null) {
      finished = true
      data.status = "FINISHED"
      if (creatorScore > opponentScore) winnerId = fresh.creatorId
      else if (opponentScore > creatorScore) winnerId = fresh.opponentId
      else isDraw = true
    }

    const updated = await tx.duel.update({
      where: { id: duelId },
      data,
    })

    if (finished) {
      await settleDuelPrizes(tx, fresh, winnerId, isDraw)

      if (isDraw) {
        await tx.user.update({
          where: { id: fresh.creatorId },
          data: { reputation: { increment: 5 } },
        })
        await tx.user.update({
          where: { id: fresh.opponentId },
          data: { reputation: { increment: 5 } },
        })
      } else if (winnerId) {
        const loserId = winnerId === fresh.creatorId ? fresh.opponentId : fresh.creatorId
        await tx.user.update({
          where: { id: winnerId },
          data: { reputation: { increment: 25 } },
        })
        const loser = await tx.user.findUnique({ where: { id: loserId } })
        if (loser) {
          await tx.user.update({
            where: { id: loserId },
            data: { reputation: Math.max(0, loser.reputation - 10) },
          })
        }
      }
    }

    return { duel: updated, finished, winnerId, isDraw, skipped: false }
  })

  return NextResponse.json({
    success: true,
    duel: sanitizeDuelForClient(result.duel),
    finished: result.finished,
    winnerId: result.winnerId,
    isDraw: result.isDraw,
    score: points,
  })
}
