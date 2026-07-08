"use client"

import { Search, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-muted/50 px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <h1 className="font-mono text-xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden w-64 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar disciplinas..."
            className="h-9 w-full bg-muted pl-10 text-xs border-border/50 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="relative h-9 w-9 border-border/50 bg-muted hover:bg-muted/80"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-destructive" />
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
