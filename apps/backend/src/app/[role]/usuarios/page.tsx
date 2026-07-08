"use client"

import { AdminUserManagement } from "@/components/dashboard/admin-user-management"
import { useAuth } from "@/components/auth-provider"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function UsuariosPage() {
  const { role } = useAuth()

  if (role !== 'ADMIN') {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-xs">Esta página é acessível apenas para administradores do sistema.</p>
        <Link href={`/${role?.toLowerCase()}/dashboard`}>
          <Button>Voltar ao Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground">
          👥 Gestão de Usuários
        </h2>
        <p className="text-muted-foreground mt-1">
          Administre contas, permissões e status dos membros da plataforma.
        </p>
      </div>

      <AdminUserManagement />
    </div>
  )
}
