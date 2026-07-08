"use client"

import { ManualLessonCreator } from "@/components/dashboard/manual-lesson-creator"
import { useAuth } from "@/components/auth-provider"
import { GraduationCap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CreateLessonPage() {
  const { role } = useAuth()

  if (role !== 'TEACHER' && role !== 'ADMIN') {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-xs">Esta funcionalidade é exclusiva para professores e administradores.</p>
        <Link href="/">
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <ManualLessonCreator />
    </div>
  )
}
