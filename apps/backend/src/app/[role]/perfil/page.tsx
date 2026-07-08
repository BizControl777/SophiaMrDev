"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Trophy, Zap, Wallet, Star, Shield, 
  Settings, Mail, Calendar, MapPin, 
  History, Medal, Target, TrendingUp, Swords,
  BookOpen, CheckCircle2, Loader2, Edit3
} from "lucide-react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function PerfilPage() {
  const { user, role, refreshUser } = useAuth()
  const [isRechargeOpen, setIsRechargeOpen] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isRecharging, setIsRecharging] = useState(false)
  
  // States para o Perfil do Professor
  const [teacherProfile, setTeacherProfile] = useState<any>(null)
  const [teacherMetrics, setTeacherMetrics] = useState({ completedLessons: 0 })
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [formData, setFormData] = useState({
    subject: "",
    bio: "",
    experience: "",
    pricePerLesson: "",
    institution: "",
    specialties: ""
  })

  // States para o Perfil do Estudante e Atividades
  const [studentStats, setStudentStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      if (role === 'TEACHER') {
        fetchTeacherData()
        fetchTeacherActivities()
      } else if (role === 'STUDENT') {
        fetchStudentStats()
        fetchStudentActivities()
      }
    }
  }, [user?.id, role])

  const fetchStudentStats = async () => {
    try {
      const response = await fetch(`/api/user/stats?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setStudentStats(data)
      }
    } catch (error) {
      console.error("Error fetching student stats:", error)
    }
  }

  const fetchStudentActivities = async () => {
    try {
      const tempActivities: any[] = []

      const formatRelativeTime = (date: Date) => {
        const diffMs = Date.now() - date.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 60) return `há ${Math.max(1, diffMins)} min`
        if (diffHours < 24) return `há ${diffHours}h`
        if (diffDays === 1) return "ontem"
        return `há ${diffDays} dias`
      }

      // 1. Duelos
      const resDuels = await fetch(`/api/user/duels?userId=${user?.id}`)
      if (resDuels.ok) {
        const duelsData = await resDuels.json()
        const duelsList = duelsData.duels || []
        duelsList.forEach((d: any) => {
          const dateVal = new Date(d.createdAt)
          let text = ""
          if (d.type === 'WIN') {
            text = `Recebeu +500 MT de prêmio por Duelo contra ${d.opponentName}`
          } else if (d.type === 'LOSS') {
            text = `Perdeu -100 MT em Duelo contra ${d.opponentName}`
          } else {
            text = `Recebeu +100 MT por Empate contra ${d.opponentName}`
          }
          tempActivities.push({
            text,
            date: formatRelativeTime(dateVal),
            type: "MONEY",
            dateObj: dateVal
          })
        })
      }

      // 2. Simulados
      const resSimulations = await fetch(`/api/simulations?userId=${user?.id}`)
      if (resSimulations.ok) {
        const simsList = await resSimulations.json()
        simsList.forEach((s: any) => {
          const dateVal = new Date(s.createdAt)
          const percent = Math.round((s.score / s.totalQuestions) * 100)
          tempActivities.push({
            text: `Completou exame de ${s.subject} (${percent}%)`,
            date: formatRelativeTime(dateVal),
            type: "LESSON",
            dateObj: dateVal
          })
        })
      }

      // 3. Conversas com Tutor IA
      const resChat = await fetch(`/api/chat?userId=${user?.id}`)
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
                date: formatRelativeTime(dateVal),
                type: "BADGE",
                dateObj: dateVal
              })
            }
          }
        })
      }

      // 4. Aulas/Mentorias solicitadas pelo estudante
      const resLessons = await fetch(`/api/lessons?userId=${user?.id}&role=STUDENT`)
      if (resLessons.ok) {
        const lessonsList = await resLessons.json()
        lessonsList.forEach((l: any) => {
          const dateVal = new Date(l.createdAt)
          let text = ""
          let type = "SOCIAL"
          if (l.status === 'COMPLETED') {
            text = `Finalizou Aula: ${l.subject} com Prof. ${l.teacherName || l.teacher.name}`
            type = "LESSON"
          } else if (l.status === 'ACCEPTED') {
            text = `Aula agendada de ${l.subject} com Prof. ${l.teacherName || l.teacher.name}`
            type = "SOCIAL"
          } else if (l.status === 'PENDING') {
            text = `Solicitou aula de ${l.subject} ao Prof. ${l.teacherName || l.teacher.name}`
            type = "SOCIAL"
          } else {
            text = `Solicitação de aula de ${l.subject} cancelada`
            type = "BADGE"
          }
          tempActivities.push({
            text,
            date: formatRelativeTime(dateVal),
            type,
            dateObj: dateVal
          })
        })
      }

      tempActivities.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
      setActivities(tempActivities.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setActivitiesLoading(false)
    }
  }

  const fetchTeacherActivities = async () => {
    try {
      const tempActivities: any[] = []

      const formatRelativeTime = (date: Date) => {
        const diffMs = Date.now() - date.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 60) return `há ${Math.max(1, diffMins)} min`
        if (diffHours < 24) return `há ${diffHours}h`
        if (diffDays === 1) return "ontem"
        return `há ${diffDays} dias`
      }

      const resLessons = await fetch(`/api/lessons?userId=${user?.id}&role=TEACHER`)
      if (resLessons.ok) {
        const lessonsList = await resLessons.json()
        lessonsList.forEach((l: any) => {
          const dateVal = new Date(l.createdAt)
          let text = ""
          let type = "SOCIAL"
          if (l.status === 'COMPLETED') {
            text = `Recebeu +${l.price} MT por Mentoria com ${l.student.name}`
            type = "MONEY"
          } else if (l.status === 'ACCEPTED') {
            text = `Aceitou solicitação de aula de ${l.student.name}`
            type = "SOCIAL"
          } else if (l.status === 'PENDING') {
            text = `Nova solicitação de aula pendente de ${l.student.name}`
            type = "LESSON"
          } else {
            text = `Solicitação de aula com ${l.student.name} cancelada`
            type = "BADGE"
          }
          tempActivities.push({
            text,
            date: formatRelativeTime(dateVal),
            type,
            dateObj: dateVal
          })
        })
      }

      tempActivities.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
      setActivities(tempActivities.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setActivitiesLoading(false)
    }
  }

  const fetchTeacherData = async () => {
    try {
      const response = await fetch(`/api/teachers/profile?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setTeacherProfile(data.profile)
        setTeacherMetrics(data.metrics)
        if (data.profile) {
          setFormData({
            subject: data.profile.subject || "",
            bio: data.profile.bio || "",
            experience: data.profile.experience || "",
            pricePerLesson: data.profile.pricePerLesson?.toString() || "",
            institution: data.profile.institution || "",
            specialties: data.profile.specialties || ""
          })
        }
      }
    } catch (error) {
      console.error("Error fetching teacher profile:", error)
    }
  }

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const response = await fetch("/api/teachers/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          ...formData
        })
      })
      if (response.ok) {
        await fetchTeacherData()
        setIsEditProfileOpen(false)
        alert("Perfil atualizado com sucesso!")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Erro ao salvar perfil.")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount)
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor, insira um valor válido.")
      return
    }
    
    if (!phoneNumber || phoneNumber.length < 9) {
      alert("Por favor, insira um número de telefone M-Pesa válido.")
      return
    }

    setIsRecharging(true)
    try {
      const res = await fetch("/api/user/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, amount, phoneNumber }),
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Sucesso! Transação ${data.transactionId}. Recarga de ${amount} MT realizada via M-Pesa!`)
        setIsRechargeOpen(false)
        setRechargeAmount("")
        if (refreshUser) await refreshUser()
      } else {
        alert("Erro ao recarregar. Tente novamente.")
      }
    } catch (error) {
      console.error(error)
      alert("Erro de conexão.")
    } finally {
      setIsRecharging(false)
    }
  }

  if (!user) return null

  const teacherBadges = [
    { name: "Mentor Elite", icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { name: "Conteúdo Premium", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Nota Máxima", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { name: "Especialista", icon: Medal, color: "text-purple-500", bg: "bg-purple-500/10" },
  ]

  const studentBadges = [
    { name: "Pioneiro", icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { name: "Duelo Invicto", icon: Shield, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Mentor Bronze", icon: Medal, color: "text-orange-500", bg: "bg-orange-500/10" },
    { name: "Cérebro de IA", icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10" },
  ]

  const badges = role === 'TEACHER' ? teacherBadges : studentBadges

  return (
    <div className="flex flex-col gap-8">
      {/* Header de Perfil */}
      <Card className="border-border/50 bg-muted/30 overflow-hidden">
        <div className="h-32 bg-linear-to-r from-primary/20 via-accent/20 to-primary/20" />
        <CardContent className="relative pt-0 pb-6 px-8">
          <div className="flex flex-col md:flex-row items-end gap-6 -mt-12">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white text-4xl font-bold">
                {user.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold">{user.name}</h2>
                 {role === 'STUDENT' && <Badge className="bg-primary hover:bg-primary">Lvl {Math.max(1, Math.floor((user?.reputation || 0) / 100) + 1)}</Badge>}
                {role === 'TEACHER' && <Badge variant="outline" className="border-accent text-accent font-bold uppercase text-[10px]">Professor Verificado</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground text-sm">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Maputo, Moçambique</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Membro desde Maio 2026</span>
              </div>
            </div>
            <div className="flex gap-2 pb-2">
              {role === 'TEACHER' && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditProfileOpen(true)}>
                  <Edit3 className="h-4 w-4" /> Editar Perfil Profissional
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" /> Definições
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Estatísticas e Saldo */}
        <div className="space-y-6 md:col-span-1">
          <Card className="border-border/50 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold font-mono uppercase">{role === 'TEACHER' ? 'Receita e Impacto' : 'Minha Economia'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Saldo Disponível</div>
                    <div className="text-xl font-bold font-mono">{user.balance} MT</div>
                  </div>
                </div>
                {role === 'TEACHER' ? (
                  <Button size="sm" variant="ghost" className="text-xs text-primary font-bold">Sacar</Button>
                ) : (
                  <Button size="sm" variant="ghost" className="text-xs text-primary font-bold" onClick={() => setIsRechargeOpen(true)}>Recarregar</Button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Reputação</div>
                    <div className="text-xl font-bold font-mono">{user.reputation}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold font-mono uppercase">Conquistas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge, i) => (
                  <div key={i} className={`p-3 rounded-xl ${badge.bg} border border-white/5 flex flex-col items-center text-center gap-2`}>
                    <badge.icon className={`h-6 w-6 ${badge.color}`} />
                    <span className="text-[10px] font-bold">{badge.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atividade e Desempenho */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-4 grid-cols-3">
            {role === 'TEACHER' ? (
              <>
                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="pt-6 text-center">
                    <History className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold font-mono">{teacherMetrics.completedLessons}</div>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">Mentorias Realizadas</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="pt-6 text-center">
                    <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                    <div className="text-2xl font-bold font-mono">{teacherProfile?.rating ? teacherProfile.rating.toFixed(1) : "5.0"}</div>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">Avaliação Média</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="pt-6 text-center">
                    <BookOpen className="h-6 w-6 mx-auto mb-2 text-accent" />
                    <div className="text-2xl font-bold font-mono">15</div>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">Recursos na Biblioteca</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="pt-6 text-center">
                    <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold font-mono">{studentStats?.totalSimulations ?? 0}</div>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">Exames Concluídos</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="pt-6 text-center">
                    <Swords className="h-6 w-6 mx-auto mb-2 text-destructive" />
                    <div className="text-2xl font-bold font-mono">{studentStats?.wonDuels ?? 0}</div>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">Duelos Vencidos</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-accent" />
                    <div className="text-2xl font-bold font-mono">{studentStats?.averageScore ?? 0}%</div>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">Taxa de Acerto</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card className="border-border/50 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold font-mono uppercase flex items-center gap-2">
                <History className="h-4 w-4" /> Histórico de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span className="text-xs text-muted-foreground font-mono">Buscando histórico...</span>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                    Nenhuma atividade registrada no histórico.
                  </div>
                ) : (
                  activities.map((act, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-card/50 transition-colors group">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                        act.type === 'MONEY' ? 'bg-accent' : 
                        act.type === 'BADGE' ? 'bg-yellow-500' : 
                        act.type === 'LESSON' ? 'bg-primary' : 'bg-purple-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground/90">{act.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{act.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recarregar Saldo</DialogTitle>
            <DialogDescription>
              Insira o número do seu M-Pesa e o valor. Enviaremos uma solicitação de pagamento (Push) para o seu telefone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Número M-Pesa</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ex: 841234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor (MT)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ex: 500"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
              />
            </div>
            <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-500 border border-red-500/20 flex items-start gap-2">
              <Zap className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <strong>Integração M-Pesa Ativada</strong>
                <span>Esta operação debitará dinheiro real. Certifique-se de ter fundos na sua conta M-Pesa. Será pedido o seu PIN no celular.</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRechargeOpen(false)} disabled={isRecharging}>Cancelar</Button>
            <Button onClick={handleRecharge} disabled={isRecharging || !rechargeAmount || !phoneNumber} className="bg-red-600 hover:bg-red-700 text-white font-bold">
              {isRecharging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Pagar via M-Pesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Perfil Profissional */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil Profissional</DialogTitle>
            <DialogDescription>
              Atualize as informações que os alunos verão quando procurarem por si.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Disciplina Principal</Label>
                <Input
                  placeholder="Ex: Matemática"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Instituição / Formação</Label>
                <Input
                  placeholder="Ex: UEM"
                  value={formData.institution}
                  onChange={(e) => setFormData({...formData, institution: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Anos de Experiência</Label>
                <Input
                  placeholder="Ex: 5 anos"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Preço por Aula (MT)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 500"
                  value={formData.pricePerLesson}
                  onChange={(e) => setFormData({...formData, pricePerLesson: e.target.value})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Especialidades (separadas por vírgula)</Label>
              <Input
                placeholder="Ex: Álgebra Linear, Geometria Analítica"
                value={formData.specialties}
                onChange={(e) => setFormData({...formData, specialties: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label>Biografia (Sobre mim)</Label>
              <Textarea
                placeholder="Conte um pouco sobre a sua paixão por ensinar e a sua metodologia..."
                className="h-24 resize-none"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)} disabled={isSavingProfile}>Cancelar</Button>
            <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-primary hover:bg-primary/90 font-bold">
              {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
