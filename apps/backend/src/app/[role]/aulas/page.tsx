"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, BookOpen, Clock, ChevronRight, FileText, 
  Video, GraduationCap, ArrowLeft, Play, Maximize2, 
  HelpCircle, Sparkles, Users, MessageSquare, Zap, ShieldCheck 
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { useEffect } from "react"

export default function StudentLessonsPage() {
  const { role } = useAuth()
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [mentors, setMentors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lessonsRes, mentorsRes] = await Promise.all([
          fetch('/api/lessons/manual'),
          fetch('/api/teachers')
        ])
        
        if (lessonsRes.ok) {
          const lessonsData = await lessonsRes.json()
          setLessons(lessonsData)
        }
        
        if (mentorsRes.ok) {
          const mentorsData = await mentorsRes.json()
          setMentors(mentorsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Proteção de Rota
  if (role !== 'STUDENT') {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-xs">Esta funcionalidade é exclusiva para estudantes da SophIA.</p>
        <Link href={`/${role?.toLowerCase()}/dashboard`}>
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    )
  }

  const [activeMaterial, setActiveMaterial] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isMentorSelectOpen, setIsMentorSelectOpen] = useState(false)
  const [helpText, setHelpText] = useState("")

  const filteredLessons = lessons.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) || 
    l.subject.toLowerCase().includes(search.toLowerCase())
  )

  const handleAskIA = () => {
    alert(`Enviando para o Tutor IA: "Pode me explicar melhor este trecho: ${helpText}?"`)
    setIsHelpOpen(false)
  }

  const handleAskMentor = (mentor: any) => {
    alert(`Solicitação de ajuda enviada para o Mentor ${mentor.name}. O sistema notificará você quando ele aceitar.`)
    setIsMentorSelectOpen(false)
    setIsHelpOpen(false)
  }

  if (selectedLesson) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedLesson(null)
              setActiveMaterial(null)
            }} 
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para a lista
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Aula:</span>
            <span className="text-xs font-bold text-primary">{selectedLesson.title}</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-3 space-y-6">
            {/* Visualizador de Mídia */}
            {activeMaterial ? (
              <Card className="border-border/50 bg-black overflow-hidden relative aspect-video flex items-center justify-center">
                {activeMaterial.type === 'VIDEO' ? (
                  <iframe 
                    src={activeMaterial.url} 
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                ) : (
                  <iframe 
                    src={activeMaterial.url} 
                    className="w-full h-[600px] border-0 bg-white"
                  />
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50 text-white border-0 hover:bg-black/70">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="border-border/50 bg-muted/30 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Play className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Selecione um material para começar</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Assista aos vídeos ou leia os PDFs preparados pelo seu professor diretamente aqui.
                </p>
              </Card>
            )}

            {/* Descrição e Ajuda */}
            <Card className="border-border/50 bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold font-mono uppercase flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Conteúdo da Aula
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[10px] gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => {
                    setHelpText(selectedLesson.description)
                    setIsHelpOpen(true)
                  }}
                >
                  <HelpCircle className="h-3 w-3" /> Não entendi?
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm leading-relaxed text-foreground/80">
                  {selectedLesson.description}
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-xl bg-card border border-border/50">
                    <h4 className="font-mono text-xs font-bold uppercase mb-4 flex items-center gap-2">
                      🎯 Objetivos
                    </h4>
                    <ul className="space-y-3">
                      {selectedLesson.objectives.map((obj: string, i: number) => (
                        <li key={i} className="text-[11px] flex items-start gap-3">
                          <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 text-[8px] font-bold">
                            {i + 1}
                          </div>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/50 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold font-mono uppercase">Materiais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedLesson.materials.map((mat: any, i: number) => (
                  <Button 
                    key={i} 
                    variant={activeMaterial === mat ? "secondary" : "outline"}
                    className={`w-full justify-start gap-3 border-border/50 bg-card hover:bg-muted text-xs h-12 ${
                      activeMaterial === mat ? "border-primary/50 ring-1 ring-primary/20" : ""
                    }`}
                    onClick={() => setActiveMaterial(mat)}
                  >
                    {mat.type === 'PDF' ? <FileText className="h-4 w-4 text-red-500" /> : <Video className="h-4 w-4 text-blue-500" />}
                    <span className="truncate">{mat.title}</span>
                  </Button>
                ))}
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-accent hover:bg-accent/90 font-bold">
                  Marcar Concluída
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-border/50 bg-primary/5 border-dashed">
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-primary opacity-50" />
                <h4 className="text-xs font-bold">Dúvida rápida?</h4>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Chame um mentor online para te ajudar agora mesmo.
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-primary text-[10px] font-bold mt-2"
                  onClick={() => setIsMentorSelectOpen(true)}
                >
                  Ver mentores online
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de Pedido de Ajuda */}
        <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" /> Suporte Contextual
              </DialogTitle>
              <DialogDescription>
                Este trecho está difícil? Escolha como quer que expliquemos.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-muted/50 p-4 rounded-lg border text-xs italic text-muted-foreground mb-6">
                "{helpText}"
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  className="h-24 flex flex-col gap-2 bg-linear-to-br from-primary to-accent border-0"
                  onClick={handleAskIA}
                >
                  <Sparkles className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-bold">Pedir à IA</div>
                    <div className="text-[9px] opacity-80">Explicação instantânea</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 border-border/50 hover:bg-muted"
                  onClick={() => setIsMentorSelectOpen(true)}
                >
                  <Users className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <div className="font-bold">Chamar Mentor</div>
                    <div className="text-[9px] text-muted-foreground">Alunos experientes online</div>
                  </div>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Seletor de Mentores */}
        <Dialog open={isMentorSelectOpen} onOpenChange={setIsMentorSelectOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Mentores Disponíveis</DialogTitle>
              <DialogDescription>
                Estes colegas têm alta reputação e podem te ajudar agora.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] mt-4">
              <div className="space-y-3 pr-4">
                {mentors.map((mentor) => (
                  <div 
                    key={mentor.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleAskMentor(mentor)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {mentor.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-bold">{mentor.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" /> 
                          {mentor.reputation} Reputação • {mentor.subject}
                        </div>
                      </div>
                    </div>
                    <MessageSquare className="h-4 w-4 text-primary opacity-50" />
                  </div>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <p className="text-[10px] text-muted-foreground text-center w-full">
                A IA do SophIA monitora estas interações para garantir a qualidade.
              </p>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground">
          🎓 Aulas Manuais
        </h2>
        <p className="text-muted-foreground mt-1">
          Acesse conteúdos exclusivos preparados pelos nossos professores.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Pesquisar aulas ou professores..." 
          className="pl-10 bg-muted/30 border-border/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredLessons.map((lesson) => (
          <Card 
            key={lesson.id} 
            className="border-border/50 bg-muted/30 hover:border-primary/50 transition-all cursor-pointer group flex flex-col"
            onClick={() => setSelectedLesson(lesson)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px]">
                  {lesson.subject}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {lesson.duration}
                </div>
              </div>
              <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                {lesson.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <GraduationCap className="h-3 w-3" /> {lesson.teacher}
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {lesson.description}
              </p>
            </CardContent>
            <CardFooter className="pt-0 flex items-center justify-between">
              <span className="text-[10px] font-bold text-accent uppercase">
                {lesson.materials.length} materiais inclusos
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
