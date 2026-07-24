"use client"

import { authFetch } from "@/lib/auth-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, MessageSquare, Wallet, Video, Plus, Trash2, FileText, Play, Music, Image as ImageIcon, Link as LinkIcon, Loader2, BookOpen, ChevronRight } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { LiveVideoRoom } from "./live-video-room"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { v4 as uuidv4 } from 'uuid'
import { LessonChatModal } from "./lesson-chat-modal"

type MaterialType = 'PDF' | 'VIDEO' | 'TEXT' | 'YOUTUBE' | 'IMAGE' | 'AUDIO'

interface Material {
  id: string
  type: MaterialType
  title: string
  url?: string
  file?: File
}

export function TeacherRequestsView() {
  const { user, role, refreshUser } = useAuth()
  const [activeLesson, setActiveLesson] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingLesson, setAcceptingLesson] = useState<any>(null)
  const [acceptLoading, setAcceptLoading] = useState(false)
  const [chatLesson, setChatLesson] = useState<any>(null)
  
  // Published lessons state
  const [publishedLessons, setPublishedLessons] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  
  // Material upload state for the acceptance dialog
  const [materials, setMaterials] = useState<Material[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadType, setActiveUploadType] = useState<MaterialType | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchRequests()
      fetchPublishedLessons()
    }
  }, [user?.id])

  const fetchRequests = async () => {
    if (!user?.id) return
    try {
      const response = await authFetch(`/api/lessons?userId=${user.id}&role=${role}`)
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error("Error fetching requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPublishedLessons = async () => {
    if (!user?.id) return
    try {
      const response = await authFetch(`/api/teachers/lessons?teacherId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setPublishedLessons(data)
      }
    } catch (error) {
      console.error("Error fetching published lessons:", error)
    }
  }

  const importFromLesson = (lesson: any) => {
    const importedMaterials = lesson.materials.map((m: any) => ({
      id: uuidv4(),
      type: m.type as MaterialType,
      title: m.title,
      url: m.url
    }))
    setMaterials([...materials, ...importedMaterials])
    setIsImporting(false)
  }

  const triggerFileUpload = (type: MaterialType) => {
    if (type === 'YOUTUBE') {
      const url = prompt("Cole o link do YouTube:")
      if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
        setMaterials([...materials, { id: uuidv4(), type: 'YOUTUBE', title: "Vídeo do YouTube", url }])
      }
      return
    }
    setActiveUploadType(type)
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeUploadType) return
    setMaterials([...materials, { id: uuidv4(), type: activeUploadType, title: file.name, file }])
    e.target.value = ""
    setActiveUploadType(null)
  }

  const handleAction = async (id: string, action: 'ACCEPTED' | 'REJECTED' | 'COMPLETED') => {
    if (action === 'ACCEPTED') {
      const req = requests.find(r => r.id === id)
      setAcceptingLesson(req)
      setMaterials([])
      return
    }

    const confirmMessage =
      action === 'COMPLETED'
        ? "Deseja realmente finalizar esta aula?"
        : "Deseja realmente rejeitar esta solicitação?"
    if (!confirm(confirmMessage)) return

    try {
      const response = await authFetch("/api/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: id,
          status: action,
        })
      })

      if (response.ok) {
        await fetchRequests()
        await refreshUser()
        if (action === 'COMPLETED') setActiveLesson(null)
      }
    } catch (error) {
      console.error("Error updating request:", error)
    }
  }

  const confirmAcceptance = async () => {
    if (!acceptingLesson) return
    setAcceptLoading(true)

    try {
      const response = await authFetch("/api/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: acceptingLesson.id,
          status: 'ACCEPTED',
          materials: materials.map(m => ({
            type: m.type,
            title: m.title,
            url: m.url || (m.file ? `FILE:${m.file.name}` : "")
          }))
        })
      })

      if (response.ok) {
        await fetchRequests()
        await refreshUser()
        setAcceptingLesson(null)
      } else {
        alert("Erro ao aceitar a aula.")
      }
    } catch (error) {
      console.error("Error accepting lesson:", error)
    } finally {
      setAcceptLoading(false)
    }
  }

  if (activeLesson) {
    return (
      <LiveVideoRoom 
        lessonId={activeLesson.id}
        roomName={activeLesson.id}
        teacherName="Você"
        subject={activeLesson.subject}
        price={activeLesson.price}
        materials={activeLesson.materials}
        onClose={() => setActiveLesson(null)}
        onComplete={() => handleAction(activeLesson.id, 'COMPLETED')}
      />
    )
  }

  return (
    <>
      <Card className="border-border/50 bg-muted/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold font-mono uppercase tracking-wider">
            Solicitações de Aula
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {requests.filter(r => r.status === 'PENDING').length} novas
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.length === 0 && !loading && (
              <p className="text-center text-muted-foreground text-xs py-4">Nenhuma solicitação encontrada.</p>
            )}
            {requests.map((req) => (
              <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-card/50 border border-border/20 gap-4 shadow-sm hover:border-primary/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-linear-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                    {req.student.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold">{req.student.name}</h4>
                      <Badge variant="secondary" className="text-[9px] h-4">{req.subject}</Badge>
                    </div>
                    
                    {req.description && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 bg-muted/30 p-2 rounded-lg italic border-l-2 border-primary/30 max-w-md">
                        "{req.description}"
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-accent font-bold">
                        <Clock className="h-3 w-3" /> Horário Agendado: {new Date(req.date).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-[10px] text-muted-foreground italic">
                        Recebida em: {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">{req.price} MT</p>
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Wallet className="h-2.5 w-2.5" /> Pagamento Retido
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {req.status === 'PENDING' ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-[11px] text-destructive hover:bg-destructive/10"
                          onClick={() => handleAction(req.id, 'REJECTED')}
                        >
                          Rejeitar
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-8 text-[11px] bg-accent hover:bg-accent/90 px-4 font-bold"
                          onClick={() => handleAction(req.id, 'ACCEPTED')}
                        >
                          Preparar & Aceitar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 text-[11px] gap-1.5 font-bold relative"
                          onClick={() => setChatLesson(req)}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {req.chatMessages && JSON.parse(req.chatMessages).length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                          )}
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className={
                          req.status === 'ACCEPTED' ? 'bg-accent/10 text-accent border-accent/20' : 
                          req.status === 'COMPLETED' ? 'bg-primary/10 text-primary border-primary/20' : 
                          'bg-destructive/10 text-destructive border-destructive/20'
                        } variant="outline">
                          {req.status === 'ACCEPTED' ? 'ACEITO' : 
                           req.status === 'COMPLETED' ? 'CONCLUÍDO' : 
                           req.status === 'REJECTED' ? 'REJEITADO' : 
                           req.status === 'CANCELLED' ? 'CANCELADO' : req.status}
                        </Badge>
                        
                        {req.status === 'ACCEPTED' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 text-[11px] gap-1.5 font-bold relative"
                              onClick={() => setChatLesson(req)}
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Chat
                              {req.chatMessages && JSON.parse(req.chatMessages).length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                </span>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-8 text-[11px] bg-primary hover:bg-primary/90 gap-1.5 font-bold"
                              onClick={() => setActiveLesson(req)}
                            >
                              <Video className="h-3 w-3" /> Iniciar Aula
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 text-[11px] border-accent/50 text-accent hover:bg-accent/10"
                              onClick={() => handleAction(req.id, 'COMPLETED')}
                            >
                              Finalizar
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Acceptance & Material Preparation Dialog */}
      <Dialog open={!!acceptingLesson} onOpenChange={() => setAcceptingLesson(null)}>
        <DialogContent className="sm:max-w-[550px] border-border/50 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              Preparar Mentoria para {acceptingLesson?.student.name}
            </DialogTitle>
            <DialogDescription>
              A aula será em <strong>{acceptingLesson && new Date(acceptingLesson.date).toLocaleString()}</strong>.
              Adicione os materiais que serão usados nesta sessão.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Anexar Materiais (Opcional)
                </Label>
                {publishedLessons.length > 0 && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-[10px] text-accent font-bold"
                    onClick={() => setIsImporting(!isImporting)}
                  >
                    {isImporting ? "Cancelar Importação" : "Importar de Aula Publicada"}
                  </Button>
                )}
              </div>

              {isImporting && (
                <div className="space-y-2 p-3 rounded-lg bg-accent/5 border border-accent/20 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] font-bold text-accent mb-2">Suas Aulas Disponíveis:</p>
                  <div className="grid gap-2 max-h-[150px] overflow-y-auto pr-1">
                    {publishedLessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => importFromLesson(lesson)}
                        className="flex items-center justify-between p-2 rounded bg-card border border-border/50 hover:border-accent/50 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3 w-3 text-accent" />
                          <div>
                            <p className="text-[10px] font-bold">{lesson.title}</p>
                            <p className="text-[8px] text-muted-foreground">{lesson.materials.length} materiais associados</p>
                          </div>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-accent" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => triggerFileUpload('PDF')} className="h-8 text-[10px] gap-1.5 border-border/50">
                  <FileText className="h-3.5 w-3.5 text-red-500" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerFileUpload('VIDEO')} className="h-8 text-[10px] gap-1.5 border-border/50">
                  <Play className="h-3.5 w-3.5 text-blue-500" /> Vídeo
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerFileUpload('YOUTUBE')} className="h-8 text-[10px] gap-1.5 border-border/50">
                  <LinkIcon className="h-3.5 w-3.5 text-red-600" /> YouTube
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerFileUpload('IMAGE')} className="h-8 text-[10px] gap-1.5 border-border/50">
                  <ImageIcon className="h-3.5 w-3.5 text-green-500" /> Imagem
                </Button>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept={
                  activeUploadType === 'PDF' ? '.pdf' : 
                  activeUploadType === 'VIDEO' ? '.mp4,.webm' : 
                  activeUploadType === 'IMAGE' ? '.jpg,.jpeg,.png,.webp' : '*'
                }
              />

              <div className="grid gap-3 max-h-[250px] overflow-y-auto pr-2">
                {materials.map((m) => (
                  <div key={m.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      {m.type === 'PDF' && <FileText className="h-4 w-4 text-red-500" />}
                      {m.type === 'VIDEO' && <Play className="h-4 w-4 text-blue-500" />}
                      {m.type === 'YOUTUBE' && <LinkIcon className="h-4 w-4 text-red-600" />}
                      {m.type === 'IMAGE' && <ImageIcon className="h-4 w-4 text-green-500" />}
                      <div>
                        <p className="text-[11px] font-bold truncate max-w-[250px]">{m.title}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">{m.type}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setMaterials(materials.filter(mat => mat.id !== m.id))} className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {materials.length === 0 && (
                  <div className="py-8 border-2 border-dashed border-border/30 rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                    <p className="text-[11px] italic text-center px-6">Nenhum material anexado. Você também pode anexar durante a aula se preferir.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 flex gap-3">
              <Wallet className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-primary">Saldo Retido: {acceptingLesson?.price} MT</p>
                <p className="text-[10px] text-primary/70">Este valor será liberado para sua conta assim que a aula for finalizada.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0 border-t border-border/50 pt-4">
            <Button variant="outline" onClick={() => setAcceptingLesson(null)} className="flex-1">Voltar</Button>
            <Button 
              onClick={confirmAcceptance} 
              className="flex-1 bg-accent hover:bg-accent/90 font-bold"
              disabled={acceptLoading}
            >
              {acceptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar e Agendar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LessonChatModal
        lesson={chatLesson}
        user={user}
        isOpen={!!chatLesson}
        onClose={() => setChatLesson(null)}
        onUpdate={fetchRequests}
      />
    </>
  )
}

