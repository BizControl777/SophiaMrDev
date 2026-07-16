"use client"

import { authFetch } from "@/lib/auth-fetch"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, FileText, Video, Save, Trash2, ListChecks, Loader2, Play, Image as ImageIcon, Music, Link as LinkIcon } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from 'uuid'

type MaterialType = 'PDF' | 'VIDEO' | 'TEXT' | 'YOUTUBE' | 'IMAGE' | 'AUDIO'

interface Material {
  id: string
  type: MaterialType
  title: string
  url?: string
  file?: File
}

export function ManualLessonCreator() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadType, setActiveUploadType] = useState<MaterialType | null>(null)

  const [lesson, setLesson] = useState({
    title: "",
    subject: "",
    description: "",
    objectives: [""],
    materials: [] as Material[]
  })

  const addObjective = () => {
    setLesson({ ...lesson, objectives: [...lesson.objectives, ""] })
  }

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...lesson.objectives]
    newObjectives[index] = value
    setLesson({ ...lesson, objectives: newObjectives })
  }

  const removeObjective = (index: number) => {
    setLesson({ ...lesson, objectives: lesson.objectives.filter((_, i) => i !== index) })
  }

  const triggerFileUpload = (type: MaterialType) => {
    if (type === 'YOUTUBE') {
      const confirmOpen = confirm("Deseja abrir o YouTube em uma nova aba para pesquisar o vídeo?")
      if (confirmOpen) {
        window.open("https://www.youtube.com", "_blank")
      }
      
      setTimeout(() => {
        const url = prompt("Após escolher o vídeo, cole o link (URL) aqui:")
        if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
          setLesson({
            ...lesson,
            materials: [...lesson.materials, {
              id: uuidv4(),
              type: 'YOUTUBE',
              title: "Vídeo do YouTube",
              url: url
            }]
          })
        } else if (url) {
          alert("Link inválido. Por favor, insira um link do YouTube.")
        }
      }, 500)
      return
    }

    if (type === 'TEXT') {
      setLesson({
        ...lesson,
        materials: [...lesson.materials, {
          id: uuidv4(),
          type: 'TEXT',
          title: "Bloco de Texto",
          url: ""
        }]
      })
      return
    }

    setActiveUploadType(type)
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeUploadType) return

    const newMaterial: Material = {
      id: uuidv4(),
      type: activeUploadType,
      title: file.name,
      file: file
    }

    setLesson({
      ...lesson,
      materials: [...lesson.materials, newMaterial]
    })
    
    // Reset
    e.target.value = ""
    setActiveUploadType(null)
  }

  const removeMaterial = (id: string) => {
    setLesson({
      ...lesson,
      materials: lesson.materials.filter(m => m.id !== id)
    })
  }

  const updateMaterialTitle = (id: string, title: string) => {
    setLesson({
      ...lesson,
      materials: lesson.materials.map(m => m.id === id ? { ...m, title } : m)
    })
  }

  const saveLesson = async () => {
    if (!user?.id) return
    if (!lesson.title || !lesson.subject) {
      alert("Por favor, preencha o título e a disciplina.")
      return
    }

    setLoading(true)
    
    // Nota: Em uma aplicação real, aqui usaríamos FormData para enviar os arquivos
    // Para este protótipo, vamos simular o envio.
    try {
      const response = await authFetch("/api/lessons/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: user.id,
          title: lesson.title,
          subject: lesson.subject,
          description: lesson.description,
          objectives: lesson.objectives,
          materials: lesson.materials.map(m => ({
            type: m.type,
            title: m.title,
            url: m.url || (m.file ? `FILE:${m.file.name}` : "")
          }))
        })
      })

      if (response.ok) {
        alert("Aula publicada com sucesso! Materiais anexados.")
        router.push(`/${user.role.toLowerCase()}/dashboard`)
      } else {
        alert("Erro ao salvar a aula. Tente novamente.")
      }
    } catch (error) {
      console.error("Error saving lesson:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAcceptType = () => {
    switch(activeUploadType) {
      case 'PDF': return ".pdf"
      case 'VIDEO': return ".mp4,.webm"
      case 'IMAGE': return ".jpg,.jpeg,.png,.webp"
      case 'AUDIO': return ".mp3,.wav"
      default: return "*"
    }
  }

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
        accept={getAcceptType()}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-2xl font-bold tracking-tight text-foreground">
            🆕 Criar Aula Multimídia
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Adicione vídeos, PDFs, imagens e outros recursos para seus alunos.
          </p>
        </div>
        <Button onClick={saveLesson} disabled={loading} className="bg-accent hover:bg-accent/90 gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Publicar Aula</>}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Informações Básicas */}
        <Card className="md:col-span-2 border-border/50 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-mono uppercase">Detalhes da Aula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Aula</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Introdução a Termodinâmica" 
                  value={lesson.title}
                  onChange={(e) => setLesson({...lesson, title: e.target.value})}
                  className="bg-card/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Disciplina</Label>
                <Select onValueChange={(v) => setLesson({...lesson, subject: v})}>
                  <SelectTrigger className="bg-card/50">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matematica">Matemática</SelectItem>
                    <SelectItem value="fisica">Física</SelectItem>
                    <SelectItem value="quimica">Química</SelectItem>
                    <SelectItem value="biologia">Biologia</SelectItem>
                    <SelectItem value="historia">História</SelectItem>
                    <SelectItem value="geografia">Geografia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="desc">Resumo Pedagógico</Label>
              <Textarea 
                id="desc" 
                placeholder="Descreva o que o aluno irá aprender nesta aula..." 
                className="h-24 bg-card/50"
                value={lesson.description}
                onChange={(e) => setLesson({...lesson, description: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Objetivos de Aprendizagem */}
        <Card className="border-border/50 bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold font-mono uppercase">Objetivos</CardTitle>
            <Button variant="ghost" size="icon" onClick={addObjective} className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lesson.objectives.map((obj, i) => (
              <div key={i} className="flex gap-2">
                <Input 
                  placeholder={`Objetivo ${i+1}`} 
                  value={obj}
                  onChange={(e) => updateObjective(i, e.target.value)}
                  className="bg-card/50 text-xs"
                />
                <Button variant="ghost" size="icon" onClick={() => removeObjective(i)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Materiais de Apoio */}
        <Card className="md:col-span-3 border-border/50 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-mono uppercase">Materiais e Recursos Multimídia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              <Button variant="outline" size="sm" onClick={() => triggerFileUpload('PDF')} className="gap-2">
                <FileText className="h-4 w-4 text-red-500" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => triggerFileUpload('VIDEO')} className="gap-2">
                <Video className="h-4 w-4 text-blue-500" /> Vídeo MP4
              </Button>
              <Button variant="outline" size="sm" onClick={() => triggerFileUpload('YOUTUBE')} className="gap-2">
                <Play className="h-4 w-4 text-red-600" /> YouTube
              </Button>
              <Button variant="outline" size="sm" onClick={() => triggerFileUpload('IMAGE')} className="gap-2">
                <ImageIcon className="h-4 w-4 text-green-500" /> Imagem
              </Button>
              <Button variant="outline" size="sm" onClick={() => triggerFileUpload('AUDIO')} className="gap-2">
                <Music className="h-4 w-4 text-purple-500" /> Áudio
              </Button>
              <Button variant="outline" size="sm" onClick={() => triggerFileUpload('TEXT')} className="gap-2">
                <ListChecks className="h-4 w-4 text-orange-500" /> Texto
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {lesson.materials.map((mat) => (
                <div key={mat.id} className="p-3 rounded-lg bg-card border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {mat.type === 'PDF' && <FileText className="h-4 w-4 text-red-500" />}
                      {mat.type === 'VIDEO' && <Video className="h-4 w-4 text-blue-500" />}
                      {mat.type === 'YOUTUBE' && <Play className="h-4 w-4 text-red-600" />}
                      {mat.type === 'IMAGE' && <ImageIcon className="h-4 w-4 text-green-500" />}
                      {mat.type === 'AUDIO' && <Music className="h-4 w-4 text-purple-500" />}
                      {mat.type === 'TEXT' && <ListChecks className="h-4 w-4 text-orange-500" />}
                      <Badge variant="secondary" className="text-[8px] uppercase">{mat.type}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeMaterial(mat.id)} className="h-6 w-6 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Título do Recurso</Label>
                    <Input 
                      value={mat.title}
                      onChange={(e) => updateMaterialTitle(mat.id, e.target.value)}
                      className="h-7 text-xs bg-muted/50"
                    />
                  </div>

                  {mat.url && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-500 truncate">
                      <LinkIcon className="h-3 w-3" />
                      {mat.url}
                    </div>
                  )}
                  {mat.file && (
                    <div className="text-[10px] text-muted-foreground truncate italic">
                      Arquivo: {mat.file.name} ({(mat.file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}

                  {/* Preview Section */}
                  <div className="mt-2 border-t border-border/30 pt-2">
                    {mat.type === 'IMAGE' && mat.file && (
                      <div className="relative aspect-video rounded overflow-hidden bg-muted">
                        <img 
                          src={URL.createObjectURL(mat.file)} 
                          alt={mat.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    {mat.type === 'VIDEO' && mat.file && (
                      <video className="w-full rounded bg-black aspect-video" controls>
                        <source src={URL.createObjectURL(mat.file)} type={mat.file.type} />
                      </video>
                    )}
                    {mat.type === 'AUDIO' && mat.file && (
                      <audio className="w-full h-8" controls>
                        <source src={URL.createObjectURL(mat.file)} type={mat.file.type} />
                      </audio>
                    )}
                    {mat.type === 'PDF' && mat.file && (
                      <Button variant="ghost" size="sm" className="w-full text-[10px] h-7 gap-1" onClick={() => window.open(URL.createObjectURL(mat.file!))}>
                        <FileText className="h-3 w-3" /> Visualizar PDF
                      </Button>
                    )}
                    {mat.type === 'YOUTUBE' && mat.url && (
                      <div className="aspect-video rounded bg-muted flex items-center justify-center overflow-hidden">
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${mat.url.includes('v=') ? mat.url.split('v=')[1].split('&')[0] : mat.url.split('/').pop()}`}
                          title="YouTube video player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {lesson.materials.length === 0 && (
                <div className="md:col-span-4 py-8 border-2 border-dashed border-border/30 rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                  <Plus className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-xs">Nenhum material adicionado ainda.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
