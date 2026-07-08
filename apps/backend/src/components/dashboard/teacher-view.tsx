import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  Star, 
  Plus, 
  Wallet, 
  Calendar, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign
} from "lucide-react"
import { TeacherRequestsView } from "./teacher-requests"
import { ManualLessonCreator } from "./manual-lesson-creator"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export function TeacherDashboard({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground">
            Painel do Professor 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            Bem-vindo, Prof. {name}. Gerencie sua carreira acadêmica e financeira.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-muted/30 border border-border/50 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-accent" />
            </div>
            <div>
              <div className="text-[9px] uppercase text-muted-foreground font-bold leading-none">Meu Saldo</div>
              <div className="text-sm font-bold font-mono text-foreground">25.000 MT</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/30 border border-border/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg gap-2"><TrendingUp className="h-4 w-4" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg gap-2"><DollarSign className="h-4 w-4" /> Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Meus Alunos", value: "145", icon: Users, color: "text-primary", sub: "+12 este mês" },
              { title: "Conteúdos", value: "12", icon: BookOpen, color: "text-accent", sub: "3.2k visualizações" },
              { title: "Solicitações", value: "8", icon: MessageSquare, color: "text-yellow-500", sub: "2 urgentes" },
              { title: "Reputação", value: "4.9", icon: Star, color: "text-destructive", sub: "Top 5% da categoria" },
            ].map((stat) => (
              <Card key={stat.title} className="border-border/50 bg-muted/30 relative overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color} group-hover:scale-110 transition-transform`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black font-mono">{stat.value}</div>
                  <p className="text-[9px] text-muted-foreground mt-1 font-medium italic">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <TeacherRequestsView />
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border/50 bg-linear-to-br from-accent/10 to-primary/10">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Total Disponível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black font-mono text-accent">25.000 MT</div>
                <Button className="w-full mt-4 bg-accent hover:bg-accent/90 font-bold">Solicitar Saque</Button>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Ganhos em Retenção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black font-mono text-primary">3.500 MT</div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">Valores de aulas agendadas aguardando conclusão.</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Projeção Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black font-mono text-foreground">85.000 MT</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px]">+15%</Badge>
                  <span className="text-[9px] text-muted-foreground">vs mês passado</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-border/50 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold font-mono">Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { desc: "Aula: Cálculo de Derivadas", date: "Hoje, 10:30", val: "+1.500 MT", type: "income" },
                  { desc: "Aula: Leis de Newton", date: "Ontem, 15:00", val: "+2.000 MT", type: "income" },
                  { desc: "Saque Efetuado", date: "2 dias atrás", val: "-15.000 MT", type: "outcome" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/20">
                    <div>
                      <p className="text-xs font-bold">{t.desc}</p>
                      <p className="text-[9px] text-muted-foreground">{t.date}</p>
                    </div>
                    <span className={`text-sm font-mono font-bold ${t.type === 'income' ? 'text-green-500' : 'text-destructive'}`}>
                      {t.val}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
