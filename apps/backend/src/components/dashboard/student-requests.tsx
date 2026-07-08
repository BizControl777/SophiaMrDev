"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Wallet, Video, CheckCircle2, Loader2, Calendar, MessageSquare, Star } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { LiveVideoRoom } from "./live-video-room"
import { LessonChatModal } from "./lesson-chat-modal"
import { LessonReviewModal } from "./lesson-review-modal"

export function StudentRequestsView() {
  const { user, role } = useAuth()
  const [activeLesson, setActiveLesson] = useState<any>(null)
  const [chatLesson, setChatLesson] = useState<any>(null)
  const [reviewLesson, setReviewLesson] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchRequests()
    }
  }, [user?.id])

  const fetchRequests = async () => {
    if (!user?.id) return
    try {
      const response = await fetch(`/api/lessons?userId=${user.id}&role=${role}`)
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error("Error fetching requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteLesson = async (id: string) => {
    if (!confirm("Deseja realmente finalizar a aula e liberar o pagamento para o professor?")) return

    try {
      const response = await fetch("/api/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: id,
          status: 'COMPLETED',
        })
      })

      if (response.ok) {
        await fetchRequests()
      }
    } catch (error) {
      console.error("Error completing lesson:", error)
    }
  }

  const handleCancelLesson = async (id: string) => {
    if (!confirm("Deseja realmente cancelar esta solicitação? O valor será reembolsado imediatamente.")) return

    try {
      const response = await fetch("/api/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: id,
          status: 'CANCELLED',
        })
      })

      if (response.ok) {
        await fetchRequests()
      }
    } catch (error) {
      console.error("Error cancelling lesson:", error)
    }
  }

  if (activeLesson) {
    return (
      <LiveVideoRoom 
        lessonId={activeLesson.id}
        roomName={activeLesson.id}
        teacherName={activeLesson.teacher.name}
        subject={activeLesson.subject}
        price={activeLesson.price}
        materials={activeLesson.materials}
        onClose={() => setActiveLesson(null)}
        onComplete={() => handleCompleteLesson(activeLesson.id)}
      />
    )
  }

  return (
    <Card className="border-border/50 bg-muted/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold font-mono uppercase tracking-wider">
          Minhas Solicitações de Aula
        </CardTitle>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          {requests.length} totais
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {requests.length === 0 && !loading && (
            <p className="text-center text-muted-foreground text-xs py-4">Você ainda não solicitou nenhuma aula.</p>
          )}
          {requests.map((req) => (
            <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-card/50 border border-border/20 gap-4 shadow-sm hover:border-primary/20 transition-all">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {req.teacher.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold">Prof. {req.teacher.name}</h4>
                    <Badge variant="secondary" className="text-[9px] h-4">{req.subject}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-accent font-bold">
                      <Calendar className="h-3 w-3" /> {new Date(req.date).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-[10px] text-muted-foreground italic">
                      Status: {
                        req.status === 'PENDING' ? 'Aguardando Professor' : 
                        req.status === 'ACCEPTED' ? 'Aceita - Prepare-se!' : 
                        req.status === 'REJECTED' ? 'Recusada pelo Professor' :
                        req.status === 'CANCELLED' ? 'Cancelada' : 'Concluída'
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">{req.price} MT</p>
                  <p className="text-[9px] text-muted-foreground flex items-center gap-1 justify-end">
                    <Wallet className="h-2.5 w-2.5" /> Pagamento Seguro
                  </p>
                </div>

                <div className="flex gap-2">
                  <Badge className={
                    req.status === 'ACCEPTED' ? 'bg-accent/10 text-accent border-accent/20' : 
                    req.status === 'COMPLETED' ? 'bg-primary/10 text-primary border-primary/20' : 
                    req.status === 'REJECTED' || req.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  } variant="outline">
                    {req.status === 'PENDING' ? 'PENDENTE' : 
                     req.status === 'ACCEPTED' ? 'ACEITO' : 
                     req.status === 'COMPLETED' ? 'CONCLUÍDO' : 
                     req.status === 'REJECTED' ? 'REJEITADO' : 
                     req.status === 'CANCELLED' ? 'CANCELADO' : req.status}
                  </Badge>
                  
                  {req.status === 'PENDING' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-[11px] border-destructive/20 text-destructive hover:bg-destructive/10 gap-1.5 font-bold"
                      onClick={() => handleCancelLesson(req.id)}
                    >
                      Cancelar
                    </Button>
                  )}
                  
                  {(req.status === 'PENDING' || req.status === 'ACCEPTED') && (
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
                  )}
                  
                  {req.status === 'ACCEPTED' && (
                    <Button 
                      size="sm" 
                      className="h-8 text-[11px] bg-primary hover:bg-primary/90 gap-1.5 font-bold"
                      onClick={() => setActiveLesson(req)}
                    >
                      <Video className="h-3 w-3" /> Entrar na Sala
                    </Button>
                  )}

                  {req.status === 'COMPLETED' && !req.review && (
                    <Button 
                      size="sm" 
                      className="h-8 text-[11px] bg-yellow-500 hover:bg-yellow-600 gap-1.5 font-bold text-white"
                      onClick={() => setReviewLesson(req)}
                    >
                      <Star className="h-3 w-3 fill-white" /> Avaliar Aula
                    </Button>
                  )}

                  {req.status === 'COMPLETED' && req.review && (
                    <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1.5 rounded-md border border-yellow-500/20">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-[10px] font-bold text-yellow-600">{req.review.rating}.0</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <LessonChatModal
        lesson={chatLesson}
        user={user}
        isOpen={!!chatLesson}
        onClose={() => setChatLesson(null)}
        onUpdate={fetchRequests}
      />

      <LessonReviewModal
        lesson={reviewLesson}
        isOpen={!!reviewLesson}
        onClose={() => setReviewLesson(null)}
        onUpdate={fetchRequests}
      />
    </Card>
  )
}
