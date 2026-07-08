"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Search, UserCog, ShieldAlert, CheckCircle2, 
  MoreVertical, Filter, UserPlus, Mail, ShieldCheck,
  Ban, ArrowUpRight, Loader2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users?search=${search}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const toggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus })
      })
      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Error toggling status:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar por nome, email..." 
            className="pl-10 bg-muted/30 border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-border/50 bg-muted/30">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <UserPlus className="h-4 w-4" /> Novo Usuário
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-muted/30 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/20 text-[10px] uppercase text-muted-foreground font-bold bg-muted/50">
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Papel (Role)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Nível / Rep</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic text-xs">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="group hover:bg-card/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border/50">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                {u.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{u.name}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Mail className="h-2.5 w-2.5" /> {u.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`text-[10px] border-none font-bold ${
                            u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500' :
                            u.role === 'TEACHER' ? 'bg-accent/10 text-accent' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-accent animate-pulse' : 'bg-destructive'}`} />
                            <span className={`text-[10px] font-bold ${u.status === 'ACTIVE' ? 'text-foreground' : 'text-destructive'}`}>
                              {u.status === 'ACTIVE' ? 'ATIVO' : 'SUSPENSO'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono font-medium">
                          Rep {u.reputation} <span className="mx-1 text-muted-foreground opacity-30">/</span> {u.balance} MT
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-card border-border/50">
                              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Ações de Conta</DropdownMenuLabel>
                              <DropdownMenuItem className="gap-2 text-xs">
                                <UserCog className="h-3.5 w-3.5" /> Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-xs">
                                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Promover a Admin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border/20" />
                              <DropdownMenuItem 
                                className="gap-2 text-xs text-destructive focus:bg-destructive/10"
                                onClick={() => toggleStatus(u.id, u.status)}
                              >
                                {u.status === 'ACTIVE' ? (
                                  <><Ban className="h-3.5 w-3.5" /> Suspender Conta</>
                                ) : (
                                  <><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Reativar Conta</>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
