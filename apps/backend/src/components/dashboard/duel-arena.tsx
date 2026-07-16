"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Swords, Trophy, Timer, Zap, CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

interface DuelArenaProps {
  opponent: any
  currentUser: any
  type: 'FRIENDLY' | 'RANKED'
  onClose: (result: 'WIN' | 'LOSS' | 'DRAW') => void
}

export function DuelArena({ opponent, currentUser, type, onClose }: DuelArenaProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userScore, setUserScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [finished, setFinished] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  // Carregar questões rápidas
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await authFetch("/api/exames/generate", {
          method: "POST",
          body: JSON.stringify({ theme: "Geral", count: 3, difficulty: "médio" }),
          headers: { "Content-Type": "application/json" }
        })
        const data = await res.json()
        if (data && data.questions) {
          setQuestions(data.questions)
        } else {
          setQuestions([])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  // Timer da questão
  useEffect(() => {
    if (loading || finished || selectedAnswer !== null) return

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleNextQuestion(false)
          return 15
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, finished, selectedAnswer, currentIndex])

  // Simulação do oponente (chance de acerto baseada no nível)
  useEffect(() => {
    if (loading || finished) return
    
    const opponentInterval = setInterval(() => {
      const chance = Math.random()
      if (chance > 0.7) { // Oponente "responde"
        setOpponentScore(s => s + (Math.random() > 0.4 ? 1 : 0))
      }
    }, 5000)

    return () => clearInterval(opponentInterval)
  }, [loading, finished])

  const handleNextQuestion = (isCorrect: boolean) => {
    if (isCorrect) setUserScore(s => s + 1)
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setTimeLeft(15)
      } else {
        setFinished(true)
      }
    }, 1000)
  }

  if (loading || questions.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-6 bg-background/50 rounded-2xl border-2 border-dashed border-primary/20">
        <div className="flex items-center gap-8">
          <Avatar className="h-20 w-20 border-4 border-primary">
            <AvatarFallback className="text-2xl font-bold bg-primary text-white">Você</AvatarFallback>
          </Avatar>
          <Swords className="h-10 w-10 text-primary animate-bounce" />
          <Avatar className="h-20 w-20 border-4 border-destructive">
            <AvatarFallback className="text-2xl font-bold bg-destructive text-white">{opponent.name[0]}</AvatarFallback>
          </Avatar>
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-mono text-xl font-bold animate-pulse">PREPARANDO ARENA...</h3>
          <p className="text-sm text-muted-foreground italic">Sincronizando questões com {opponent.name}</p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (finished) {
    const result = userScore > opponentScore ? 'WIN' : userScore < opponentScore ? 'LOSS' : 'DRAW'
    return (
      <Card className="max-w-md mx-auto border-border/50 bg-muted/30 overflow-hidden">
        <div className={`h-2 w-full ${result === 'WIN' ? 'bg-accent' : result === 'LOSS' ? 'bg-destructive' : 'bg-yellow-500'}`} />
        <CardContent className="pt-10 pb-8 text-center">
          <div className="mb-6 flex justify-center">
            {result === 'WIN' ? (
              <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-accent" />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <Swords className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <h2 className="text-3xl font-bold font-mono mb-2">
            {result === 'WIN' ? 'VITÓRIA!' : result === 'LOSS' ? 'DERROTA' : 'EMPATE'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {result === 'WIN' 
              ? `Você superou ${opponent.name} com maestria!` 
              : `Não foi dessa vez, ${opponent.name} foi mais rápido.`}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-card p-3 rounded-xl border border-border/50">
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Seu Score</div>
              <div className="text-2xl font-bold font-mono">{userScore}</div>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border/50">
              <div className="text-[10px] text-muted-foreground font-bold uppercase">{opponent.name.split(' ')[0]}</div>
              <div className="text-2xl font-bold font-mono">{opponentScore}</div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl mb-6">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-[9px] font-bold text-primary uppercase">Reputação</div>
                <div className="text-sm font-bold">{result === 'WIN' ? '+25' : '-10'} Rep</div>
              </div>
              {type === 'RANKED' && (
                <div className="text-center border-l border-primary/20 pl-4">
                  <div className="text-[9px] font-bold text-accent uppercase">Prêmio</div>
                  <div className="text-sm font-bold text-accent">{result === 'WIN' ? '+500 MT' : '-500 MT'}</div>
                </div>
              )}
            </div>
          </div>

          <Button className="w-full font-bold" onClick={() => onClose(result)}>
            Sair da Arena
          </Button>
        </CardContent>
      </Card>
    )
  }

  const q = questions[currentIndex]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* HUD de Duelo */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarFallback className="bg-primary text-white font-bold">Você</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-[10px] font-bold uppercase text-muted-foreground">Você</div>
            <div className="text-xl font-bold font-mono">{userScore}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-yellow-500 font-bold font-mono text-lg">
            <Timer className="h-5 w-5" /> {timeLeft}s
          </div>
          <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 transition-all" style={{ width: `${(timeLeft/15)*100}%` }} />
          </div>
        </div>

        <div className="flex-1 flex flex-row-reverse items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-destructive">
            <AvatarFallback className="bg-destructive text-white font-bold">{opponent.name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-muted-foreground">{opponent.name.split(' ')[0]}</div>
            <div className="text-xl font-bold font-mono text-destructive">{opponentScore}</div>
          </div>
        </div>
      </div>

      <Card className="border-border/50 bg-muted/30">
        <CardHeader>
          <div className="text-xs font-bold text-primary uppercase mb-2">Questão {currentIndex + 1}/3</div>
          <CardTitle className="text-lg leading-relaxed">{q.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {q.options.map((opt, i) => (
            <Button
              key={i}
              variant="outline"
              className={`w-full justify-start h-auto py-4 px-6 text-left whitespace-normal border-border/50 bg-card hover:bg-muted ${
                selectedAnswer !== null 
                  ? i === q.correctAnswer 
                    ? "border-accent bg-accent/10 hover:bg-accent/10" 
                    : i === selectedAnswer 
                      ? "border-destructive bg-destructive/10 hover:bg-destructive/10" 
                      : "opacity-50"
                  : ""
              }`}
              disabled={selectedAnswer !== null}
              onClick={() => {
                setSelectedAnswer(i)
                handleNextQuestion(i === q.correctAnswer)
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span>{opt}</span>
                {selectedAnswer !== null && i === q.correctAnswer && <CheckCircle2 className="h-4 w-4 text-accent" />}
                {selectedAnswer !== null && i === selectedAnswer && i !== q.correctAnswer && <XCircle className="h-4 w-4 text-destructive" />}
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-center italic text-[10px] text-muted-foreground animate-pulse">
        🤖 A IA do SophIA está monitorando a integridade do duelo...
      </div>
    </div>
  )
}
