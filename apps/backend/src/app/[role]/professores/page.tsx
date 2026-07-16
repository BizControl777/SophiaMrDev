"use client"

import { authFetch } from "@/lib/auth-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageSquare, Clock, Star, GraduationCap, Wallet, ShieldCheck, Video, X, Trophy, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LiveVideoRoom } from "@/components/dashboard/live-video-room"

export default function ProfessorsPage() {
  const { user, role, refreshUser } = useAuth()
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isViewingProfile, setIsViewingProfile] = useState(false)
  const [requests, setRequests] = useState<any[]>([])
  const [activeLesson, setActiveLesson] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [requestDescription, setRequestDescription] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (user?.id) {
      fetchRequests()
    }
  }, [user?.id])

  const fetchTeachers = async () => {
    try {
      const response = await authFetch(`/api/teachers?search=${searchTerm}`)
      const data = await response.json()
      setTeachers(data)
    } catch (error) {
      console.error("Error fetching teachers:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    if (!user?.id) return
    try {
      const response = await authFetch(`/api/lessons?userId=${user.id}&role=${role}`)
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error("Error fetching requests:", error)
    }
  }

  // Proteção de Rota
  if (role !== 'STUDENT') {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-xs">Esta funcionalidade é exclusiva para estudantes da SophIA.</p>
        <Link href={`/${role?.toLowerCase()}/dashboard`}>
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    )
  }

  const handleRequestHelp = (teacher: any) => {
    setSelectedTeacher(teacher)
    setIsViewingProfile(false)
    setIsRequesting(true)
  }

  const handleViewProfile = (teacher: any) => {
    setSelectedTeacher(teacher)
    setIsViewingProfile(true)
  }

  const confirmRequest = async () => {
    if (!user?.id || !selectedTeacher) return
    
    if (user.balance < selectedTeacher.price) {
      alert("Saldo insuficiente para esta solicitação.")
      return
    }

    if (!requestDescription.trim()) {
      alert("Por favor, descreva brevemente sua dúvida.")
      return
    }

    try {
      const response = await authFetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          teacherId: selectedTeacher.id,
          subject: selectedTeacher.subject,
          description: requestDescription,
          price: selectedTeacher.price,
          date: scheduledDate,
        })
      })

      if (response.ok) {
        await fetchRequests()
        await refreshUser()
        setIsRequesting(false)
        setRequestDescription("")
      } else {
        const error = await response.text()
        alert(`Erro: ${error}`)
      }
    } catch (error) {
      console.error("Error creating request:", error)
    }
  }

  const handleCancelRequest = async (lessonId: string) => {
    if (!confirm("Deseja realmente cancelar esta solicitação? O valor será reembolsado imediatamente.")) return

    try {
      const response = await authFetch("/api/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          status: 'CANCELLED',
        })
      })

      if (response.ok) {
        await fetchRequests()
        await refreshUser()
      }
    } catch (error) {
      console.error("Error cancelling request:", error)
    }
  }

  const handleCompleteRequest = async (lessonId: string) => {
    try {
      const response = await authFetch("/api/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          status: 'COMPLETED',
        })
      })

      if (response.ok) {
        alert("Aula concluída com sucesso! O valor foi liberado para o professor.")
        await fetchRequests()
        await refreshUser()
      }
    } catch (error) {
      console.error("Error completing request:", error)
    }
  }

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (activeLesson) {
    return (
      <LiveVideoRoom 
        lessonId={activeLesson.id}
        roomName={`Aula-${activeLesson.id}`}
        teacherName={activeLesson.teacherName}
        subject={activeLesson.subject}
        price={activeLesson.price}
        onClose={() => setActiveLesson(null)}
        onComplete={() => handleCompleteRequest(activeLesson.id)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground">
            👨‍🏫 Professores
          </h2>
          <p className="text-muted-foreground mt-1">
            Solicite ajuda personalizada dos nossos especialistas em tempo real.
          </p>
        </div>
        <div className="bg-muted/30 border border-border/50 p-4 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground font-bold">Meu Saldo</div>
            <div className="text-lg font-bold font-mono text-foreground">{user?.balance} MT</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nome ou disciplina..." 
              className="pl-10 bg-muted/30 border-border/50 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="border-border/50 bg-muted/30 overflow-hidden hover:border-primary/50 transition-colors group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarImage src={teacher.image} />
                        <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold text-lg">
                          {teacher.name.split(' ').map((n: string) => n[0]).filter((n: string) => n === n.toUpperCase()).slice(0, 2).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background ${
                        teacher.status === "online" ? "bg-accent" : "bg-muted-foreground"
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-foreground">{teacher.name}</h4>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-[10px] font-bold">{teacher.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-primary font-medium">{teacher.subject}</p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {teacher.experience}
                        </div>
                        <div className="text-[10px] font-bold text-accent">
                          {teacher.price} MT / aula
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button 
                      className="flex-1 bg-primary hover:bg-primary/90 font-bold gap-2 h-9 text-xs"
                      onClick={() => handleRequestHelp(teacher)}
                      disabled={teacher.status === 'offline'}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> {teacher.status === 'online' ? 'Solicitar Ajuda' : 'Indisponível'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 border-border/50 bg-muted/50 text-[10px]"
                      onClick={() => handleViewProfile(teacher)}
                    >
                      Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 bg-muted/30 sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-xs uppercase tracking-wider flex items-center justify-between">
                Minhas Solicitações
                {requests.length > 0 && <Badge variant="outline" className="text-[9px]">{requests.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-border/30 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Nenhuma solicitação ativa no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="flex flex-col p-3 rounded-xl bg-card/50 border border-border/20 gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{req.teacherName}</span>
                          <span className="text-[9px] text-muted-foreground">{req.subject} • {new Date(req.date).toLocaleString('pt-BR')}</span>
                        </div>
                        <Badge variant="outline" className={`text-[9px] ${
                          req.status === 'ACCEPTED' ? 'bg-accent/10 text-accent border-accent/20' : 
                          req.status === 'REJECTED' || req.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                          {req.status === 'PENDING' ? 'PENDENTE' : 
                           req.status === 'ACCEPTED' ? 'ACEITO' : 
                           req.status === 'REJECTED' ? 'REJEITADO' : 
                           req.status === 'CANCELLED' ? 'CANCELADO' : req.status}
                        </Badge>
                      </div>
                      
                      {req.status === 'PENDING' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground animate-pulse">
                            <Clock className="h-3 w-3" /> Aguardando resposta do professor...
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full h-7 text-[9px] text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleCancelRequest(req.id)}
                          >
                            Cancelar Solicitação
                          </Button>
                        </div>
                      )}

                      {req.status === 'ACCEPTED' && (
                        <Button 
                          size="sm" 
                          className="w-full h-8 bg-accent hover:bg-accent/90 gap-2 font-bold text-[10px]"
                          onClick={() => setActiveLesson(req)}
                        >
                          <Video className="h-3.5 w-3.5" /> Entrar na Sala
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isViewingProfile} onOpenChange={setIsViewingProfile}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/50 bg-card">
          <DialogHeader className="sr-only">
            <DialogTitle>Perfil do Professor</DialogTitle>
            <DialogDescription>Detalhes do perfil e especialidades do professor selecionado.</DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <>
              <div className="h-32 bg-linear-to-br from-primary/20 to-accent/20 relative">
                <div className="absolute -bottom-12 left-6">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                    <AvatarImage src={selectedTeacher.image} />
                    <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white text-3xl font-bold">
                      {selectedTeacher.name[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="pt-16 pb-6 px-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedTeacher.name}</h3>
                    <p className="text-primary font-medium">{selectedTeacher.subject}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500 justify-end">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-bold">{selectedTeacher.rating}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Avaliação Média</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Sobre</h4>
                  <p className="text-sm leading-relaxed text-foreground/80">{selectedTeacher.bio}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Especialidades</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedTeacher.specialties.map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-[9px] bg-muted/50">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Conquistas</h4>
                    <div className="space-y-1">
                      {selectedTeacher.achievements.map((a: string) => (
                        <div key={a} className="flex items-center gap-1.5 text-[10px] text-accent font-medium">
                          <Trophy className="h-3 w-3" /> {a}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs font-bold">Investimento</p>
                      <p className="text-[10px] text-muted-foreground">Por aula de 60 min</p>
                    </div>
                  </div>
                  <span className="text-xl font-black font-mono text-accent">{selectedTeacher.price} MT</span>
                </div>
              </div>
              <DialogFooter className="p-6 bg-muted/10 border-t border-border/50 gap-3">
                <Button variant="outline" onClick={() => setIsViewingProfile(false)} className="flex-1">Fechar</Button>
                <Button 
                  onClick={() => handleRequestHelp(selectedTeacher)} 
                  disabled={selectedTeacher.status === 'offline'}
                  className="flex-1 bg-primary hover:bg-primary/90 font-bold"
                >
                  Solicitar Ajuda Agora
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRequesting} onOpenChange={setIsRequesting}>
        <DialogContent className="sm:max-w-[450px] border-border/50 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Confirmar Solicitação
            </DialogTitle>
            <DialogDescription>
              Explique brevemente o que você precisa para o professor se preparar.
            </DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="py-4 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">{selectedTeacher.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{selectedTeacher.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedTeacher.subject}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-bold text-accent">{selectedTeacher.price} MT</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quando você quer a aula?
                </Label>
                <Input 
                  id="date"
                  type="datetime-local"
                  className="bg-muted/20 border-border/50 focus:border-primary/50 text-xs"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  O que você quer aprender?
                </Label>
                <Textarea 
                  id="description"
                  placeholder="Ex: Preciso de ajuda com equações do segundo grau, especialmente a fórmula de Bhaskara..."
                  className="min-h-[100px] bg-muted/20 border-border/50 resize-none focus:border-primary/50"
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                />
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <p className="text-[11px] text-primary/80 leading-tight">
                  <strong>Segurança SophIA:</strong> O valor será retido e só será liberado quando você encerrar a aula na sala de vídeo.
                </p>
              </div>

              <div className="flex items-center justify-between px-2 pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">Saldo Disponível:</span>
                <span className="text-sm font-mono font-bold text-foreground">{user?.balance} MT</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setIsRequesting(false)} className="flex-1">Cancelar</Button>
            <Button 
              onClick={confirmRequest} 
              className="flex-1 bg-primary hover:bg-primary/90 font-bold"
              disabled={!requestDescription.trim() || !scheduledDate}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
