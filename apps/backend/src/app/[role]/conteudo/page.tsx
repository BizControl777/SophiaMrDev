"use client"

import { useAuth } from "@/components/auth-provider"
import { ShieldAlert, BookOpen, FileText, PlusCircle, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ManualLessonCreator } from "@/components/dashboard/manual-lesson-creator"
import { QuestionEditor } from "@/components/dashboard/question-editor"
import { TeacherLibrary } from "@/components/dashboard/teacher-library"

export default function ConteudoPage() {
  const { role } = useAuth()

  if (role !== 'TEACHER' && role !== 'ADMIN') {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-xs">Esta funcionalidade é exclusiva para professores e administradores.</p>
        <Link href={`/${role?.toLowerCase()}/dashboard`}>
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground">
          📚 Gestão de Conteúdo
        </h2>
        <p className="text-muted-foreground mt-1">
          Crie e gerencie materiais de apoio, vídeos e exercícios para seus alunos.
        </p>
      </div>

      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList className="bg-muted/50 border border-border/50 p-1">
          <TabsTrigger value="questions" className="gap-2">
            <PlusCircle className="h-4 w-4" /> Banco de Questões
          </TabsTrigger>
          <TabsTrigger value="lessons" className="gap-2">
            <FileText className="h-4 w-4" /> Aulas Manuais
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-2">
            <LayoutGrid className="h-4 w-4" /> Minha Biblioteca
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <QuestionEditor />
        </TabsContent>

        <TabsContent value="lessons">
          <ManualLessonCreator />
        </TabsContent>

        <TabsContent value="library">
          <TeacherLibrary />
        </TabsContent>
      </Tabs>
    </div>
  )
}
