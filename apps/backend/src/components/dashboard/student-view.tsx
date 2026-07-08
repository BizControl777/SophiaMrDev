import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, BookOpen, Trophy, Swords, Activity, FileText, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"

import { StudentRequestsView } from "./student-requests"

interface ActivityItem {
  text: string
  time: string
  color: string
  date: Date
  result?: string
}

export function StudentDashboard({ name }: { name: string }) {
  const { user } = useAuth()
  const [statsData, setStatsData] = useState<any>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [subjectAverages, setSubjectAverages] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const currentHour = new Date().getHours()
  let greeting = "Boa noite"
  if (currentHour >= 5 && currentHour < 12) greeting = "Bom dia"
  else if (currentHour >= 12 && currentHour < 18) greeting = "Boa tarde"

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) return
      try {
        // 1. Carrega Estatísticas Gerais
        const resStats = await fetch(`/api/user/stats?userId=${user.id}`)
        let statsJson: any = null
        if (resStats.ok) {
          statsJson = await resStats.json()
          setStatsData(statsJson)
        }

        const tempActivities: ActivityItem[] = []

        // 2. Carrega Duelos Recentes
        const resDuels = await fetch(`/api/user/duels?userId=${user.id}`)
        if (resDuels.ok) {
          const duelsData = await resDuels.json()
          const duelsList = duelsData.duels || []
          duelsList.forEach((d: any) => {
            const dateVal = new Date(d.createdAt)
            let resultText = ""
            let outcomeColor = "bg-primary"
            if (d.type === 'WIN') {
              resultText = `Ganhou duelo vs ${d.opponentName}`
              outcomeColor = "bg-accent"
            } else if (d.type === 'LOSS') {
              resultText = `Perdeu duelo vs ${d.opponentName}`
              outcomeColor = "bg-destructive"
            } else {
              resultText = `Empatou duelo vs ${d.opponentName}`
              outcomeColor = "bg-yellow-500"
            }

            tempActivities.push({
              text: resultText,
              time: formatRelativeTime(dateVal),
              color: outcomeColor,
              date: dateVal
            })
          })
        }

        // 3. Carrega Simulados Recentes
        const resSimulations = await fetch(`/api/simulations?userId=${user.id}`)
        if (resSimulations.ok) {
          const simsList = await resSimulations.json()

          // Calcular médias reais por disciplina para o gráfico
          const averages: Record<string, { totalScore: number, totalQuestions: number }> = {}
          simsList.forEach((s: any) => {
            if (!averages[s.subject]) {
              averages[s.subject] = { totalScore: 0, totalQuestions: 0 }
            }
            averages[s.subject].totalScore += s.score
            averages[s.subject].totalQuestions += s.totalQuestions
          })

          const calculatedAverages: Record<string, number> = {}
          for (const [subject, data] of Object.entries(averages)) {
            calculatedAverages[subject] = data.totalQuestions > 0 
              ? Math.round((data.totalScore / data.totalQuestions) * 100)
              : 0
          }
          setSubjectAverages(calculatedAverages)

          simsList.forEach((s: any) => {
            const dateVal = new Date(s.createdAt)
            const percent = Math.round((s.score / s.totalQuestions) * 100)
            tempActivities.push({
              text: `Completou exame de ${s.subject}`,
              result: `${percent}%`,
              time: formatRelativeTime(dateVal),
              color: "bg-cyan-500",
              date: dateVal
            })
          })
        }

        // 4. Carrega Conversas Recentes com o Tutor IA
        const resChat = await fetch(`/api/chat?userId=${user.id}`)
        if (resChat.ok) {
          const chatMessages = await resChat.json()
          chatMessages.forEach((msg: any) => {
            if (msg.role === 'assistant') {
              const match = msg.content.match(/\[Disciplina:\s*([^\]\n]+)\]/i)
              if (match) {
                const subject = match[1].trim()
                const dateVal = new Date(msg.createdAt)
                tempActivities.push({
                  text: `Estudou ${subject} com o Tutor IA`,
                  time: formatRelativeTime(dateVal),
                  color: "bg-yellow-500",
                  date: dateVal
                })
              }
            }
          })
        }

        // Ordena atividades por data mais recente
        tempActivities.sort((a, b) => b.date.getTime() - a.date.getTime())
        setActivities(tempActivities.slice(0, 4)) // mostra apenas as 4 últimas

      } catch (err) {
        console.error("Error loading dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user?.id])

  // Helper para formatar tempo relativo simples
  function formatRelativeTime(date: Date) {
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `há ${Math.max(1, diffMins)} min`
    if (diffHours < 24) return `há ${diffHours}h`
    if (diffDays === 1) return "ontem"
    return `há ${diffDays} dias`
  }

  // Prepara cards
  const statsList = [
    {
      title: "Média Geral",
      value: statsData ? `${statsData.averageScore}%` : "0%",
      label: statsData?.averageScore > 0 ? "Baseado nos exames feitos" : "Nenhum exame ainda",
      icon: Activity,
      color: "text-primary",
      trend: "up"
    },
    {
      title: "Exames Feitos",
      value: statsData ? `${statsData.totalSimulations}` : "0",
      label: "Simulados e provas",
      icon: BookOpen,
      color: "text-accent",
      trend: "up"
    },
    {
      title: "Posição Global",
      value: statsData?.rankPosition ? `#${statsData.rankPosition}` : "-",
      label: statsData ? `De ${statsData.totalStudents} estudantes` : "Fora do ranking",
      icon: Trophy,
      color: "text-yellow-500",
      trend: "up"
    },
    {
      title: "Duelos",
      value: statsData ? `${statsData.wonDuels}/${statsData.totalDuels}` : "0/0",
      label: statsData?.totalDuels > 0 ? `${Math.round((statsData.wonDuels/statsData.totalDuels)*100)}% de vitórias` : "Nenhum duelo ainda",
      icon: Swords,
      color: "text-destructive",
      trend: "up"
    }
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground">
          {greeting}, {name} 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          Aqui está o resumo do seu desempenho acadêmico.
        </p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center border border-border/50 bg-muted/30 rounded-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm font-mono text-muted-foreground">Carregando painel acadêmico...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsList.map((stat) => (
              <Card key={stat.title} className="border-border/50 bg-muted/30 relative overflow-hidden">
                <div className={`absolute top-0 left-0 h-1 w-full bg-current ${stat.color}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">{stat.value}</div>
                  <p className="mt-1 text-[10px] text-muted-foreground font-mono">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl p-6 border border-primary/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg font-mono">Praticar Exames Oficiais</h3>
                <p className="text-sm text-muted-foreground mt-1">Acesse os exames de admissão da UEM e UP diretamente do repositório.</p>
              </div>
            </div>
            <Link href="/student/exames">
              <Button className="font-bold bg-primary hover:bg-primary/90 gap-2 shrink-0">
                Acessar Exames <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <StudentRequestsView />

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4 border-border/50 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold font-mono">Desempenho por Disciplina</CardTitle>
              </CardHeader>
              <CardContent className="h-[230px] border-t border-border/20 p-6 flex flex-col justify-end">
                {Object.keys(subjectAverages).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Trophy className="h-10 w-10 text-yellow-500 mb-3 animate-bounce" />
                    <h4 className="font-bold text-sm">Nenhum simulado feito ainda</h4>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1">
                      Realize exames ou simulados para começar a gerar seu gráfico de desempenho acadêmico por matéria.
                    </p>
                  </div>
                ) : (
                  <div className="flex h-full items-end justify-between gap-4 pt-4">
                    {Object.entries(subjectAverages).map(([subject, avg], i) => {
                      const colors = [
                        "bg-primary",
                        "bg-accent",
                        "bg-yellow-500",
                        "bg-cyan-500",
                        "bg-destructive",
                        "bg-purple-500"
                      ]
                      const color = colors[i % colors.length]
                      return (
                        <div key={subject} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <span className="text-[9px] font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            {avg}%
                          </span>
                          <div className="w-full bg-muted/30 rounded-t-lg overflow-hidden relative flex items-end" style={{ height: "70%" }}>
                            <div 
                              className={`w-full ${color} rounded-t-lg transition-all duration-1000 ease-out`} 
                              style={{ height: `${avg}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold font-mono truncate max-w-full uppercase text-muted-foreground mt-1 text-center">
                            {subject.substring(0, 3)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-3 border-border/50 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold font-mono uppercase flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {activities.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-border/20 pb-3 last:border-0 last:pb-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${activity.color}`} />
                    <div className="flex flex-1 flex-col">
                      <span className="text-xs text-foreground font-medium">
                        {activity.text} {activity.result && <strong className="text-accent ml-1">{activity.result}</strong>}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                    Nenhuma atividade acadêmica registrada.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
