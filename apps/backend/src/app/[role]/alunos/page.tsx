"use client"

import { useAuth } from "@/components/auth-provider"
import { ShieldAlert, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AlunosPage() {
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
          👥 Meus Alunos
        </h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe o progresso e desempenho dos estudantes que você orienta.
        </p>
      </div>

      <Card className="border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm font-bold font-mono uppercase">Lista de Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/30 rounded-xl">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <p className="text-sm text-muted-foreground">Esta funcionalidade está sendo preparada para o ambiente de Moçambique.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
