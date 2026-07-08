"use client"

import { useAuth } from "@/components/auth-provider"
import { TeacherRequestsView } from "@/components/dashboard/teacher-requests"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SolicitacoesPage() {
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
          📩 Solicitações de Aula
        </h2>
        <p className="text-muted-foreground mt-1">
          Gerencie os pedidos de ajuda enviados pelos estudantes.
        </p>
      </div>

      <TeacherRequestsView />
    </div>
  )
}
