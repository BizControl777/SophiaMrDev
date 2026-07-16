"use client"

import { authFetch } from "@/lib/auth-fetch"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Trash2, Eye, Calendar, FileText, Play, Link as LinkIcon, Image as ImageIcon, Music, MoreVertical, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function TeacherLibrary() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<any>(null)

  useEffect(() => {
    if (user?.id) {
      fetchLessons()
    }
  }, [user?.id])

  const fetchLessons = async () => {
    try {
      const response = await authFetch(`/api/teachers/lessons?teacherId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setLessons(data)
      }
    } catch (error) {
      console.error("Error fetching library:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteLesson = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.")) return

    try {
      const response = await authFetch(`/api/lessons/content?id=${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setLessons(lessons.filter(l => l.id !== id))
      }
    } catch (error) {
      console.error("Error deleting lesson:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
        <p className="mt-4 text-sm text-muted-foreground">Carregando sua biblioteca...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {lessons.length === 0 ? (
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-bold">Sua biblioteca está vazia</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-2">
              Comece criando sua primeira aula manual na aba "Aulas Manuais".
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="border-border/50 bg-muted/30 hover:border-primary/30 transition-all group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase bg-primary/5 text-primary border-primary/20">
                    {lesson.subject}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteLesson(lesson.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-base font-bold mt-2 line-clamp-1">{lesson.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8 italic">
                  {lesson.description || "Sem descrição disponível."}
                </p>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(lesson.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {lesson.materials?.length || 0} materiais
                  </div>
                </div>
                <div className="flex gap-1 mt-3">
                  {Array.from(new Set(lesson.materials?.map((m: any) => m.type))).map((type: any) => (
                    <div key={type} className="p-1 rounded bg-card border border-border/50">
                      {type === 'PDF' && <FileText className="h-3 w-3 text-red-500" />}
                      {type === 'VIDEO' && <Play className="h-3 w-3 text-blue-500" />}
                      {type === 'YOUTUBE' && <Play className="h-3 w-3 text-red-600" />}
                      {type === 'IMAGE' && <ImageIcon className="h-3 w-3 text-green-500" />}
                      {type === 'AUDIO' && <Music className="h-3 w-3 text-purple-500" />}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t border-border/10">
                <Button 
                  variant="ghost" 
                  className="w-full text-xs gap-2 hover:bg-primary/5 hover:text-primary mt-2"
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <Eye className="h-3.5 w-3.5" /> Ver Detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Lesson Details Dialog */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="sm:max-w-[600px] border-border/50 bg-card max-h-[90vh] overflow-y-auto">
          {selectedLesson && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="text-[9px] uppercase">{selectedLesson.subject}</Badge>
                </div>
                <DialogTitle className="text-2xl font-bold font-mono">{selectedLesson.title}</DialogTitle>
                <DialogDescription className="text-sm">
                  Criada em {new Date(selectedLesson.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Resumo Pedagógico</h4>
                  <p className="text-sm text-foreground/80 bg-muted/30 p-3 rounded-lg border border-border/50">
                    {selectedLesson.description || "Nenhuma descrição fornecida."}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Materiais Associados</h4>
                  <div className="grid gap-2">
                    {selectedLesson.materials?.map((mat: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                        <div className="flex items-center gap-3">
                          {mat.type === 'PDF' && <FileText className="h-4 w-4 text-red-500" />}
                          {mat.type === 'VIDEO' && <Play className="h-4 w-4 text-blue-500" />}
                          {mat.type === 'YOUTUBE' && <Play className="h-4 w-4 text-red-600" />}
                          {mat.type === 'IMAGE' && <ImageIcon className="h-4 w-4 text-green-500" />}
                          <span className="text-sm font-medium">{mat.title}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase">{mat.type}</Badge>
                      </div>
                    ))}
                    {(!selectedLesson.materials || selectedLesson.materials.length === 0) && (
                      <p className="text-xs text-muted-foreground italic">Nenhum material associado.</p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setSelectedLesson(null)} className="w-full sm:w-auto">Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
