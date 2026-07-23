"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ShieldCheck, Activity, Database, LayoutDashboard, UserCog } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminUserManagement } from "./admin-user-management"

export function AdminDashboard({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground">
          Painel de Administração 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          Monitoramento global do sistema SophIA.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Usuários", value: "1.2k", icon: Users, color: "text-primary" },
          { title: "Status da API IA", value: "Online", icon: Activity, color: "text-accent" },
          { title: "Segurança", value: "Nível 4", icon: ShieldCheck, color: "text-yellow-500" },
          { title: "Uso de Dados", value: "85%", icon: Database, color: "text-destructive" },
        ].map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-muted/30 relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <UserCog className="h-4 w-4" /> Gestão de Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            <Card className="border-border/50 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold font-mono uppercase">Relatórios de Sistema</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-20 text-muted-foreground italic text-xs">
                Logs de auditoria e métricas de infraestrutura serão exibidos aqui...
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
