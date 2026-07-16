"use client"

import { authFetch } from "@/lib/auth-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Swords, Trophy, Users, Zap, Coins, Shield, History, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { DuelArena } from "@/components/dashboard/duel-arena"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"

interface OnlineOpponent {
  id: string
  name: string
  reputation: number
  avatar: string | null
  level: number
}

interface RecentActivity {
  id: string
  opponentName: string
  type: 'WIN' | 'LOSS' | 'DRAW'
}

export default function CompeticoesPage() {
  const { user, role } = useAuth()
  const [opponents, setOpponents] = useState<OnlineOpponent[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null)
  const [isChallenging, setIsChallenging] = useState(false)
  const [isBattling, setIsBattling] = useState(false)
  const [challengeType, setChallengeType] = useState<'FRIENDLY' | 'RANKED'>('FRIENDLY')

  useEffect(() => {
    async function fetchCompetitionsData() {
      if (!user?.id) return
      try {
        // 1. Busca os estudantes reais do ranking para a seção de "Colegas Online"
        const resRanking = await authFetch('/api/ranking?role=STUDENT&limit=10')
        if (resRanking.ok) {
          const data = await resRanking.json()
          const students = data.ranking || []
          // Filtra o próprio usuário logado
          const filtered = students
            .filter((s: any) => s.id !== user.id)
            .map((s: any) => ({
              id: s.id,
              name: s.name,
              reputation: s.reputation,
              avatar: s.avatar,
              level: Math.floor(s.reputation / 100) + 1 // Calcula o nível dinamicamente baseado na rep
            }))
          setOpponents(filtered)
        }

        // 2. Busca o histórico real de duelos
        const resDuels = await authFetch(`/api/user/duels?userId=${user.id}`)
        if (resDuels.ok) {
          const data = await resDuels.json()
          setRecentActivity(data.duels || [])
        }

        // 3. Busca o percentil para a "Liga"
        const resStats = await authFetch(`/api/user/stats?userId=${user.id}`)
        if (resStats.ok) {
          const data = await resStats.json()
          setUserStats(data)
        }

      } catch (err) {
        console.error("Error loading competitions data:", err)
      } finally {
        setLoading(false)
      }
    }

    if (role === 'STUDENT') {
      fetchCompetitionsData()
    }
  }, [role, user?.id])

  // Proteção de Rota
  if (role !== 'STUDENT') {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Swords className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-xs">Esta funcionalidade é exclusiva para estudantes da SophIA.</p>
        <Link href={`/${role?.toLowerCase()}/dashboard`}>
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    )
  }

  const handleChallenge = (opponent: any) => {
    setSelectedOpponent(opponent)
    setIsChallenging(true)
  }

  const confirmChallenge = () => {
    setIsChallenging(false)
    setIsBattling(true)
  }

  const handleEndBattle = (result: string) => {
    setIsBattling(false)
    setSelectedOpponent(null)
    // Recarregar os dados para atualizar o saldo, reputação e histórico
    window.location.reload()
  }

  // Função para definir a Liga com base na reputação do usuário
  const getLeagueDetails = () => {
    const rep = user?.reputation || 0
    if (rep >= 2000) return { name: "LIGA DIAMANTE", text: "Você é um mestre supremo da plataforma!", color: "border-sky-400 text-sky-400 bg-sky-400/10" }
    if (rep >= 1000) return { name: "LIGA PLATINA", text: "Você está no topo da elite acadêmica.", color: "border-teal-400 text-teal-400 bg-teal-400/10" }
    if (rep >= 500) return { name: "LIGA OURO", text: "Você está no top 5% dos estudantes.", color: "border-yellow-500 text-yellow-500 bg-yellow-500/10" }
    if (rep >= 200) return { name: "LIGA PRATA", text: "Ótimo progresso! Continue avançando.", color: "border-zinc-400 text-zinc-400 bg-zinc-400/10" }
    return { name: "LIGA BRONZE", text: "Desafie colegas para subir de liga.", color: "border-amber-600 text-amber-600 bg-amber-600/10" }
  }

  const league = getLeagueDetails()

  if (isBattling && selectedOpponent) {
    return <DuelArena opponent={selectedOpponent} currentUser={user} type={challengeType} onClose={handleEndBattle} />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            ⚔️ Competições & Duelos
          </h2>
          <p className="text-muted-foreground mt-1">
            Desafie colegas, ganhe reputação e suba no ranking.
          </p>
        </div>
        <div className="flex gap-4">
          <Card className="border-border/50 bg-muted/30 p-3 px-6 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-bold">Reputação</div>
              <div className="text-lg font-bold font-mono">{user?.reputation}</div>
            </div>
          </Card>
          <Card className="border-border/50 bg-muted/30 p-3 px-6 flex items-center gap-3">
            <Coins className="h-5 w-5 text-accent" />
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-bold">Saldo</div>
              <div className="text-lg font-bold font-mono">{user?.balance?.toFixed(2)} MT</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Opponents List */}
        <Card className="md:col-span-2 border-border/50 bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold font-mono uppercase">Colegas Online</CardTitle>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 animate-pulse">
              ● {opponents.length} online
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground font-mono">Buscando oponentes...</span>
              </div>
            ) : opponents.map((opp) => (
              <div key={opp.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/20 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={opp.avatar || undefined} />
                    <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold">
                      {opp.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-bold">{opp.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Zap className="h-3 w-3 text-yellow-500" /> Nível {opp.level} • {opp.reputation} Reputação
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="gap-2 font-bold bg-primary hover:bg-primary/90"
                  onClick={() => handleChallenge(opp)}
                >
                  <Swords className="h-4 w-4" /> Desafiar
                </Button>
              </div>
            ))}

            {!loading && opponents.length === 0 && (
              <div className="text-center p-8 text-muted-foreground font-mono text-sm">
                Nenhum oponente disponível no momento.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Stats / Leaderboard Preview */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold font-mono uppercase">Minha Liga</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <div className="h-24 w-24 rounded-full bg-linear-to-t from-primary/20 to-accent/20 border-2 border-primary/50 flex items-center justify-center mb-4 relative">
                <Shield className="h-12 w-12 text-primary" />
                <div className="absolute -bottom-2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {league.name}
                </div>
              </div>
              <h3 className="font-bold text-center mt-2">
                {userStats ? `Líder de ${userStats.bestSubject}` : 'Especialista'}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 text-center px-4">
                {userStats?.percentileText ? `Você está no ${userStats.percentileText}` : league.text}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold font-mono uppercase flex items-center gap-2">
                <History className="h-4 w-4" /> Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : recentActivity.map((act) => (
                <div key={act.id} className="flex items-center justify-between text-[11px] border-b border-border/10 pb-2 last:border-0 last:pb-0">
                  <span className="font-medium text-foreground">
                    {act.type === 'WIN' ? `Venceu ${act.opponentName}` : act.type === 'LOSS' ? `Perdeu para ${act.opponentName}` : `Empatou com ${act.opponentName}`}
                  </span>
                  <span className={`font-bold font-mono ${act.type === 'WIN' ? 'text-accent' : act.type === 'LOSS' ? 'text-destructive' : 'text-yellow-500'}`}>
                    {act.type === 'WIN' ? '+25 Rep' : act.type === 'LOSS' ? '-10 Rep' : '+5 Rep'}
                  </span>
                </div>
              ))}

              {!loading && recentActivity.length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground font-mono">
                  Nenhum duelo recente registrado.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isChallenging} onOpenChange={setIsChallenging}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" /> Iniciar Duelo
            </DialogTitle>
            <DialogDescription>
              Escolha a modalidade do desafio para {selectedOpponent?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-6">
            <Card 
              className={`p-4 cursor-pointer border-2 transition-all hover:bg-muted/50 ${challengeType === 'FRIENDLY' ? 'border-primary bg-primary/5' : 'border-border/50'}`}
              onClick={() => setChallengeType('FRIENDLY')}
            >
              <Users className="h-6 w-6 mb-2 text-muted-foreground" />
              <h4 className="text-sm font-bold">Amigável</h4>
              <p className="text-[10px] text-muted-foreground mt-1">Vale apenas Reputação e experiência.</p>
            </Card>
            
            <Card 
              className={`p-4 cursor-pointer border-2 transition-all hover:bg-muted/50 ${challengeType === 'RANKED' ? 'border-accent bg-accent/5' : 'border-border/50'}`}
              onClick={() => setChallengeType('RANKED')}
            >
              <Coins className="h-6 w-6 mb-2 text-accent" />
              <h4 className="text-sm font-bold">Apostado</h4>
              <p className="text-[10px] text-muted-foreground mt-1">Vale 500 MT + Reputação em dobro.</p>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChallenging(false)}>Recuar</Button>
            <Button className={challengeType === 'RANKED' ? 'bg-accent hover:bg-accent/90' : 'bg-primary'} onClick={confirmChallenge}>
              Enviar Desafio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
