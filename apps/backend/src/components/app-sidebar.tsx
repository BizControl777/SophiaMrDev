"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Bot,
  FileText,
  Swords,
  Trophy,
  School,
  User,
  Settings,
  Users,
  ShieldCheck,
  BookOpen,
  MessageSquareQuote,
  Plus,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { UserRole } from "@/types/auth"

import Link from "next/link"
import { useRouter } from "next/navigation"

interface NavItem {
  title: string
  url: string
  icon: React.ElementType
  isActive?: boolean
  roles: UserRole[]
  badge?: string
}

const navMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
    roles: ["STUDENT", "TEACHER", "ADMIN"],
  },
  {
    title: "Tutor IA",
    url: "/dashboard/tutor",
    icon: Bot,
    roles: ["STUDENT"],
  },
  {
    title: "Simulados",
    url: "/dashboard/exames",
    icon: FileText,
    roles: ["STUDENT"],
    badge: "Novo",
  },
  {
    title: "Professores",
    url: "/dashboard/professores",
    icon: Users,
    roles: ["STUDENT"],
  },
  {
    title: "Solicitações",
    url: "/dashboard/solicitacoes",
    icon: MessageSquareQuote,
    roles: ["TEACHER"],
  },
  {
    title: "Criar Aula",
    url: "/dashboard/criar-aula",
    icon: Plus,
    roles: ["TEACHER"],
  },
  {
    title: "Minhas Aulas",
    url: "/dashboard/aulas",
    icon: School,
    roles: ["STUDENT"],
  },
]

const competition: NavItem[] = [
  {
    title: "Arena de Duelos",
    url: "/dashboard/duelos",
    icon: Swords,
    roles: ["STUDENT"],
  },
  {
    title: "Competições",
    url: "/dashboard/competicoes",
    icon: Trophy,
    roles: ["STUDENT"],
  },
  {
    title: "Rankings",
    url: "/dashboard/rankings",
    icon: Users,
    roles: ["STUDENT"],
  },
]

const admin: NavItem[] = [
  {
    title: "Gestão de Usuários",
    url: "/dashboard/usuarios",
    icon: ShieldCheck,
    roles: ["ADMIN"],
  },
  {
    title: "Conteúdo Acadêmico",
    url: "/dashboard/conteudo",
    icon: BookOpen,
    roles: ["ADMIN", "TEACHER"],
  },
]

const management: NavItem[] = [
  {
    title: "Perfil",
    url: "/dashboard/perfil",
    icon: User,
    roles: ["STUDENT", "TEACHER", "ADMIN"],
  },
  {
    title: "Configurações",
    url: "/dashboard/configuracoes",
    icon: Settings,
    roles: ["STUDENT", "TEACHER", "ADMIN"],
  },
]

export function AppSidebar() {
  const { user, role, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const prefixUrl = (url: string) => {
    if (!role) return url
    const r = role.toLowerCase()
    
    // O Dashboard é o único que mantém o sufixo /dashboard
    if (url === "/dashboard") return `/${r}/dashboard`
    
    // Para as outras rotas, removemos o prefixo "/dashboard/" e substituímos pelo papel do usuário
    // Ex: /dashboard/tutor -> /student/tutor
    return url.replace("/dashboard/", `/${r}/`)
  }

  const filterByRole = (items: NavItem[]) => {
    return items
      .filter(item => role && item.roles.includes(role))
      .map(item => ({ ...item, url: prefixUrl(item.url) }))
  }

  const filteredMain = filterByRole(navMain)
  const filteredComp = filterByRole(competition)
  const filteredAdmin = filterByRole(admin)
  const filteredMgmt = filterByRole(management)

  return (
    <Sidebar className="border-r border-border bg-muted/50">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-primary to-accent overflow-hidden">
            <img src="/fota.jpg" alt="SophIA Logo" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-lg font-bold leading-none text-foreground">
              SophIA
            </span>
            <span className="text-[10px] text-muted-foreground">
              {role === 'ADMIN' ? 'Painel Administrativo' : role === 'TEACHER' ? 'Painel do Professor' : 'Plataforma Inteligente'}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        {filteredMain.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Principal
            </SidebarGroupLabel>
            <SidebarMenu>
              {filteredMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    className={item.isActive ? "bg-primary/10 text-primary-foreground" : ""}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge className="bg-primary text-white text-[10px]">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {filteredComp.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Competição
            </SidebarGroupLabel>
            <SidebarMenu>
              {filteredComp.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge className="bg-primary text-white text-[10px]">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {filteredAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Administração
            </SidebarGroupLabel>
            <SidebarMenu>
              {filteredAdmin.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Gestão
          </SidebarGroupLabel>
          <SidebarMenu>
            {filteredMgmt.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link href={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white">
              {user?.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold text-foreground">
              {user?.name}
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              {role === 'STUDENT' ? `Estudante · Premium` : role === 'TEACHER' ? 'Professor' : 'Administrador'}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Sair do sistema"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
