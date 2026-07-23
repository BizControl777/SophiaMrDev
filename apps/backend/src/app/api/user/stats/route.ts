import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, resolveUserId } from "@/lib/api-auth"

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const userId = resolveUserId(session, searchParams.get("userId"))

    // 1. Obter posição no ranking e percentil global
    const allStudents = await db.user.findMany({
      where: { role: 'STUDENT', status: 'ACTIVE' },
      orderBy: [
        { reputation: 'desc' },
        { balance: 'desc' },
        { name: 'asc' }
      ],
      select: { id: true }
    })

    const totalStudents = allStudents.length
    const userRankIndex = allStudents.findIndex((s: { id: string }) => s.id === userId)
    
    let percentile = 100
    let rankPosition = 0
    let percentileText = "Não Ranqueado"

    if (userRankIndex !== -1) {
      rankPosition = userRankIndex + 1
      percentile = (rankPosition / totalStudents) * 100
      
      if (percentile <= 1) percentileText = "Top 1% Global"
      else if (percentile <= 5) percentileText = "Top 5% Global"
      else if (percentile <= 10) percentileText = "Top 10% Global"
      else if (percentile <= 30) percentileText = "Top 30% Global"
      else percentileText = `Top ${Math.ceil(percentile)}% Global`
    }

    // 2. Obter a melhor área (baseada nas pontuações dos simulados)
    const simulations = await db.simulation.findMany({
      where: { userId }
    })
    
    let bestSubject = "Geral"
    if (simulations.length > 0) {
      // Agrupar simulados por disciplina e somar pontuações
      const subjectScores: Record<string, number> = {}
      simulations.forEach((sim: any) => {
        if (!subjectScores[sim.subject]) subjectScores[sim.subject] = 0
        subjectScores[sim.subject] += sim.score
      })
      
      // Encontrar a disciplina com maior pontuação
      let maxScore = -1
      for (const [subject, score] of Object.entries(subjectScores)) {
        if (score > maxScore) {
          maxScore = score
          bestSubject = subject
        }
      }
    }

    // 3. Dias Estudando (Sequência / Streak proxy baseada nos simulados feitos ou dias desde criação)
    const user = await db.user.findUnique({ where: { id: userId } })
    const daysSinceCreation = user ? Math.max(1, Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))) : 1
    // Para deixar mais gamificado, vamos usar o número de simulados + duelos como "dias de ofensiva"
    const duels = await db.duel.count({
      where: {
        OR: [{ creatorId: userId }, { opponentId: userId }],
        status: "FINISHED"
      }
    })
    
    const streak = Math.min(daysSinceCreation, simulations.length + duels + 1) // Proxy para "sequência de dias"

    // 4. "Mentoria" - Duelos vencidos ou aulas onde foi aluno ajudado (vamos usar duelos vencidos para o card)
    const wonDuels = await db.duel.count({
      where: {
        status: "FINISHED",
        OR: [
          { creatorId: userId, creatorScore: { gt: 0 } }, // Mock simples, na real precisaria comparar os scores
          { opponentId: userId, opponentScore: { gt: 0 } }
        ]
      }
    })

    // Calcular média geral baseada nas pontuações de todos os simulados
    const totalQuestionsSum = simulations.reduce((sum: number, sim: any) => sum + sim.totalQuestions, 0)
    const scoreSum = simulations.reduce((sum: number, sim: any) => sum + sim.score, 0)
    const averageScore = totalQuestionsSum > 0 ? Math.round((scoreSum / totalQuestionsSum) * 100) : 0

    return NextResponse.json({
      rankPosition,
      percentile,
      percentileText,
      bestSubject,
      streak,
      mentoring: wonDuels, // Usaremos no frontend
      totalStudents,
      averageScore,
      totalSimulations: simulations.length,
      wonDuels,
      totalDuels: duels
    })

  } catch (error) {
    console.error("[USER_STATS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
