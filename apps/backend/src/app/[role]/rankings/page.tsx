"use client"

import { authFetch } from "@/lib/auth-fetch"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Crown, TrendingUp, Users, Zap, Loader2, Star, Swords } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface RankedUser {
  id: string
  name: string
  avatar: string | null
  reputation: number
  balance: number
  role: string
}

interface UserStats {
  percentileText: string
  bestSubject: string
  streak: number
  mentoring: number
}

export default function RankingsPage() {
  const { role, user } = useAuth()
  const [ranking, setRanking] = useState<RankedUser[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Busca os melhores estudantes da plataforma limitados a 50
        const resRanking = await authFetch('/api/ranking?role=STUDENT&limit=50')
        if (!resRanking.ok) throw new Error('Falha ao carregar ranking')
        const dataRanking = await resRanking.json()
        setRanking(dataRanking.ranking)

        // 2. Busca as estatísticas pessoais do usuário logado (se for estudante)
        if (user?.id) {
          const resStats = await authFetch(`/api/user/stats?userId=${user.id}`)
          if (resStats.ok) {
            const dataStats = await resStats.json()
            setUserStats(dataStats)
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar dados')
      } finally {
        setLoading(false)
      }
    }

    if (role === 'STUDENT' || role === 'ADMIN') {
      fetchData()
    }
  }, [role, user?.id])
  
  // Proteção de Rota
  if (role !== 'STUDENT' && role !== 'ADMIN') {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-xs">Esta funcionalidade é exclusiva para estudantes e administradores.</p>
        <Link href={`/${role?.toLowerCase()}/dashboard`}>
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    )
  }

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return "bg-yellow-500/10 border-yellow-500/50 hover:bg-yellow-500/20"
      case 1: return "bg-zinc-400/10 border-zinc-400/50 hover:bg-zinc-400/20"
      case 2: return "bg-orange-600/10 border-orange-600/50 hover:bg-orange-600/20"
      default: return "bg-transparent hover:bg-muted/50"
    }
  }

  // Cards dinâmicos se os dados estiverem disponíveis, caso contrário mantém placeholders bonitos
  const topCards = [
    { title: userStats?.percentileText || "Global", icon: Trophy, color: "text-yellow-500", label: "Seu Nível" },
    { title: userStats ? `Líder de ${userStats.bestSubject}` : "Especialista", icon: Medal, color: "text-primary", label: "Sua melhor área" },
    { title: "Sequência", icon: TrendingUp, color: "text-accent", label: userStats ? `${userStats.streak} dias estudando` : "Ofensiva" },
    { title: "Duelos / Mentoria", icon: Swords, color: "text-primary", label: userStats ? `${userStats.mentoring} vitórias na Arena` : "Atividade" },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Ranking Global
        </h2>
        <p className="text-muted-foreground mt-1">
          Os melhores candidatos da SophIA baseados na reputação acadêmica.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {topCards.map((stat, i) => (
          <Card key={i} className="border-border/50 bg-muted/30 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center">
              <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color} animate-pulse`} />
              <h4 className="font-bold text-sm truncate">{stat.title}</h4>
              <p className="text-[10px] text-muted-foreground uppercase mt-1 font-bold">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader className="bg-muted/20 border-b border-border/50">
          <CardTitle className="text-sm font-bold font-mono uppercase flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" /> Líderes de Reputação
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-12">
               <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
               <p className="text-muted-foreground font-mono text-sm">Carregando dados dos estudantes...</p>
             </div>
          ) : error ? (
            <div className="text-center p-8 text-destructive">
              Erro ao carregar o ranking: {error}
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-[10px] uppercase text-muted-foreground">
                    <th className="px-6 py-4 font-bold">Posição</th>
                    <th className="px-6 py-4 font-bold">Estudante</th>
                    <th className="px-6 py-4 font-bold text-right">Reputação</th>
                    <th className="px-6 py-4 font-bold text-right">Apoio (Saldo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {ranking.map((student, index) => {
                    const isCurrentUser = user?.id === student.id
                    
                    return (
                      <tr key={student.id} className={`group transition-colors ${getRankStyle(index)} ${isCurrentUser ? 'ring-inset ring-2 ring-primary' : ''}`}>
                        <td className="px-6 py-4">
                          {index <= 2 ? (
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shadow-sm ${
                              index === 0 ? 'bg-yellow-500 text-yellow-950 ring-2 ring-yellow-500/50' : 
                              index === 1 ? 'bg-zinc-300 text-zinc-900 ring-2 ring-zinc-400/50' : 
                              'bg-orange-600 text-white ring-2 ring-orange-600/50'
                            }`}>
                              {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                            </div>
                          ) : (
                            <span className="text-sm font-mono font-bold text-muted-foreground ml-3">#{index + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className={`h-10 w-10 border-2 shadow-sm ${index === 0 ? 'border-yellow-500' : index === 1 ? 'border-zinc-400' : index === 2 ? 'border-orange-600' : 'border-border'}`}>
                              <AvatarImage src={student.avatar || undefined} />
                              <AvatarFallback className={isCurrentUser ? "bg-primary text-white font-bold" : "bg-muted font-bold"}>
                                {student.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold flex items-center gap-2">
                                {student.name}
                                {isCurrentUser && <Badge className="h-4 text-[9px] px-1.5 bg-primary hover:bg-primary/90">VOCÊ</Badge>}
                              </span>
                              <span className="text-xs text-muted-foreground">Membro da Comunidade</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Zap className={`h-4 w-4 ${index <= 2 ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                            <span className="font-mono text-base font-bold">{student.reputation}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="font-mono text-sm font-semibold text-accent bg-accent/10 px-2 py-1 rounded-md">
                             S$ {student.balance.toFixed(2)}
                           </span>
                        </td>
                      </tr>
                    )
                  })}
                  
                  {ranking.length === 0 && (
                     <tr>
                        <td colSpan={4} className="text-center p-8 text-muted-foreground">
                          Nenhum estudante com reputação encontrado.
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
