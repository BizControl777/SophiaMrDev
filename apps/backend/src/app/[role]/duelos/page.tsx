"use client"

import { DuelArena } from "@/components/dashboard/duel-arena"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function DuelosPage() {
  const { role, user } = useAuth()
  const [opponent, setOpponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOpponent = async () => {
      try {
        // Agora busca estudantes reais do ranking para duelar
        const res = await fetch('/api/ranking?role=STUDENT&limit=20')
        if (res.ok) {
          const data = await res.json()
          const students = data.ranking || []
          
          // Filtra o próprio usuário da lista
          const otherStudents = students.filter((s: any) => s.id !== user?.id)
          
          if (students.length > 0) {
            // Se a filtragem falhar, pega a lista geral. Pega um aleatório
            const list = otherStudents.length > 0 ? otherStudents : students
            const randomOpponent = list[Math.floor(Math.random() * list.length)]
            
            setOpponent({
              id: randomOpponent.id,
              name: randomOpponent.name,
              avatar: randomOpponent.avatar,
              rating: randomOpponent.reputation || 1200
            })
          }
        }
      } catch (error) {
        console.error("Error fetching opponent:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (role === 'STUDENT') {
      fetchOpponent()
    }
  }, [role])

  if (role !== 'STUDENT') {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-xs">A Arena de Duelos é exclusiva para estudantes competitivos.</p>
        <Link href={`/${role?.toLowerCase()}/dashboard`}>
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    )
  }

  const handleDuelClose = (result: 'WIN' | 'LOSS' | 'DRAW') => {
    console.log("Duelo finalizado com resultado:", result)
    window.location.href = `/${role?.toLowerCase()}/competicoes`
  }

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Procurando oponente...</p>
      </div>
    )
  }

  if (!opponent) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Nenhum oponente encontrado</h2>
        <p className="text-muted-foreground max-w-xs">Não há oponentes disponíveis no momento.</p>
        <Link href={`/${role?.toLowerCase()}/dashboard`}>
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-mono">Arena de Duelos ⚔️</h2>
        <p className="text-muted-foreground">Desafie outros estudantes e suba no ranking nacional.</p>
      </div>
      <DuelArena 
        opponent={opponent} 
        currentUser={user}
        type="RANKED" 
        onClose={handleDuelClose} 
      />
    </div>
  )
}
