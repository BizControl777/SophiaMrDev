"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Video, Mic, MicOff, VideoOff, PhoneOff, ShieldCheck, CheckCircle2, Loader2, MessageSquare, BookOpen, FileText, Image as ImageIcon, Link as LinkIcon, Bot } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Material {
  type: 'PDF' | 'VIDEO' | 'TEXT' | 'YOUTUBE' | 'IMAGE' | 'AUDIO'
  title: string
  url: string
}

interface LiveVideoRoomProps {
  lessonId: string
  roomName: string
  teacherName: string
  subject: string
  price: number
  materials?: string | any[] // Pode vir como string JSON do banco ou array
  onClose: () => void
  onComplete?: () => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export function LiveVideoRoom({ lessonId, roomName, teacherName, subject, price, materials, onClose, onComplete }: LiveVideoRoomProps) {
  const { role } = useAuth()
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const [api, setApi] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isFinished, setIsFinished] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  // Parse materiais se for string
  const parsedMaterials: Material[] = typeof materials === 'string' 
    ? (materials ? JSON.parse(materials) : []) 
    : (Array.isArray(materials) ? materials : [])

  useEffect(() => {
    const loadJitsiScript = () => {
      const script = document.createElement("script")
      script.src = "https://meet.jit.si/external_api.js"
      script.async = true
      script.onload = () => initJitsi()
      document.body.appendChild(script)
    }

    const initJitsi = () => {
      if (!jitsiContainerRef.current) return

      const options = {
        roomName: `SophIA-${lessonId}-${roomName.replace(/\s+/g, "-")}`,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            "microphone", "camera", "closedcaptions", "desktop", "fullscreen",
            "fmf2", "hangup", "profile", "chat", "recording",
            "livestreaming", "etherpad", "sharedvideo", "settings", "raisehand",
            "videoquality", "filmstrip", "invite", "feedback", "stats", "shortcuts",
            "tileview", "videobackgroundblur", "download", "help", "mute-everyone",
            "security"
          ],
        },
        configOverwrite: {
          disableDeepLinking: true,
          prejoinPageEnabled: false,
        },
      }

      const newApi = new window.JitsiMeetExternalAPI("meet.jit.si", options)
      setApi(newApi)
      setLoading(false)

      newApi.addEventListener("videoConferenceLeft", () => {
        onClose()
      })
    }

    loadJitsiScript()

    return () => {
      if (api) api.dispose()
    }
  }, [lessonId])

  const handleCompleteLesson = () => {
    setIsFinished(true)
    if (onComplete) onComplete()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Header da Sala */}
      <div className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-xl shadow-lg">
            🎓
          </div>
          <div>
            <h2 className="font-bold text-sm leading-none flex items-center gap-2">
              {subject} 
              <Badge variant="outline" className="text-[8px] h-3.5 border-primary/30 text-primary">ID: {lessonId.split('-')[0]}</Badge>
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">
              {role === 'STUDENT' ? `Professor: ${teacherName}` : `Aula com Aluno`} • <span className="text-green-500 animate-pulse">●</span> Ao Vivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSidebar(!showSidebar)}
            className={`h-8 text-[10px] font-bold gap-2 ${showSidebar ? 'bg-primary/10 border-primary/30 text-primary' : ''}`}
          >
            <BookOpen className="h-3.5 w-3.5" /> 
            {showSidebar ? "Esconder Materiais" : "Ver Materiais"}
          </Button>

          {role === 'STUDENT' && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span className="text-[9px] font-bold text-primary uppercase">Pagamento Seguro</span>
            </div>
          )}
          
          {role === 'STUDENT' && !isFinished && (
            <Button 
              size="sm" 
              className="h-9 bg-accent hover:bg-accent/90 font-bold text-xs gap-2 px-4 shadow-lg shadow-accent/20"
              onClick={handleCompleteLesson}
            >
              <CheckCircle2 className="h-4 w-4" /> Finalizar & Pagar
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Área Principal (Vídeo + Sidebar) */}
      <div className="flex-1 flex overflow-hidden bg-black">
        {/* Jitsi Video */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-white font-mono text-sm animate-pulse">Conectando ao Jitsi Meet...</p>
            </div>
          )}
          <div ref={jitsiContainerRef} className="w-full h-full" />
        </div>

        {/* Sidebar de Materiais */}
        {showSidebar && (
          <div className="w-80 border-l border-border/50 bg-card flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border/50 bg-muted/30">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Materiais da Aula
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {parsedMaterials.length > 0 ? (
                  parsedMaterials.map((m, index) => (
                    <a 
                      key={index}
                      href={m.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center border border-border/50 group-hover:border-primary/30">
                        {m.type === 'PDF' && <FileText className="h-4 w-4 text-red-500" />}
                        {m.type === 'VIDEO' && <Video className="h-4 w-4 text-blue-500" />}
                        {m.type === 'YOUTUBE' && <Video className="h-4 w-4 text-red-600" />}
                        {m.type === 'IMAGE' && <ImageIcon className="h-4 w-4 text-green-500" />}
                        {!['PDF', 'VIDEO', 'YOUTUBE', 'IMAGE'].includes(m.type) && <LinkIcon className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{m.title}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">{m.type}</p>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground italic">
                      Nenhum material foi anexado para esta aula.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 bg-muted/30 border-t border-border/50">
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 flex gap-3">
                <Bot className="h-4 w-4 text-primary shrink-0" />
                <p className="text-[10px] text-primary/80 leading-relaxed">
                  <strong>Dica SophIA:</strong> Use os materiais ao lado para acompanhar a explicação do professor.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Mobile/Info */}
      <div className="md:hidden p-4 border-t border-border/50 bg-card">
        {role === 'STUDENT' && (
          <Button className="w-full bg-accent font-bold" onClick={handleCompleteLesson}>
            Liberar Pagamento ({price} MT)
          </Button>
        )}
      </div>
    </div>
  )
}
