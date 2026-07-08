"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  ArrowRight, 
  Clock, 
  Timer,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle
} from "lucide-react"

interface Question {
  id: string
  text: string
  options: string[] // Já parseado do JSON
  correctAnswer: number
  explanation?: string
  topic?: string
}

interface SimulationProps {
  title: string
  subject: string
  questions: Question[]
  timeLimit: number // em minutos
  onComplete: (results: { score: number, total: number, timeSpent: number }) => void
  onClose: () => void
}

export function SimulationEnvironment({ title, subject, questions, timeLimit, onComplete, onClose }: SimulationProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    if (timeLeft <= 0) {
      submitSimulation()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentIdx].id]: value
    }))
  }

  const submitSimulation = () => {
    let score = 0
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        score++
      }
    })

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    setIsFinished(true)
    onComplete({ score, total: questions.length, timeSpent })
  }

  if (isFinished) {
    // Componente de resultado simplificado aqui ou delegado para o pai
    return null 
  }

  const currentQuestion = questions[currentIdx]
  const isLastQuestion = currentIdx === questions.length - 1
  const answeredCount = Object.keys(answers).length

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Topbar Realística */}
      <header className="h-16 border-b border-border/50 bg-muted/30 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-primary/10 text-primary font-mono">
            {subject.toUpperCase()}
          </Badge>
          <h1 className="font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-md">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 font-mono font-bold ${timeLeft < 300 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
            <Timer className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
          <Button variant="destructive" size="sm" onClick={() => setShowConfirmSubmit(true)} className="font-bold hidden md:flex">
            Entregar Prova
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de Navegação (Grelha de Questões) */}
        <aside className="w-64 border-r border-border/50 bg-muted/10 p-4 hidden lg:flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Progresso</span>
            <span>{answeredCount} / {questions.length}</span>
          </div>
          <Progress value={(answeredCount / questions.length) * 100} className="h-1.5" />
          
          <div className="grid grid-cols-4 gap-2 mt-4 overflow-y-auto">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`h-10 w-10 rounded-lg border text-xs font-bold transition-all ${
                  currentIdx === i 
                    ? 'border-primary bg-primary text-white scale-110' 
                    : answers[questions[i].id] !== undefined
                      ? 'border-accent/50 bg-accent/10 text-accent'
                      : 'border-border/50 hover:border-primary/50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </aside>

        {/* Área da Questão */}
        <main className="flex-1 overflow-y-auto p-4 md:p-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                <LayoutGrid className="h-3 w-3" /> Questão {currentIdx + 1}
              </div>
              <h2 className="text-xl md:text-2xl font-medium leading-relaxed text-foreground/90">
                {currentQuestion.text}
              </h2>
            </div>

            <RadioGroup 
              value={answers[currentQuestion.id]?.toString()} 
              onValueChange={(v) => handleAnswer(parseInt(v))}
              className="space-y-4"
            >
              {currentQuestion.options.map((opt, i) => (
                <div 
                  key={i}
                  className={`flex items-center space-x-3 rounded-xl border p-5 transition-all cursor-pointer group ${
                    answers[currentQuestion.id] === i 
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                  }`}
                  onClick={() => handleAnswer(i)}
                >
                  <div className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
                    answers[currentQuestion.id] === i ? "bg-primary border-primary text-white" : "border-border/50 group-hover:border-primary/50"
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <RadioGroupItem value={i.toString()} id={`opt-${i}`} className="sr-only" />
                  <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer text-base font-medium leading-tight">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex items-center justify-between pt-8 border-t border-border/50">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              
              {isLastQuestion ? (
                <Button onClick={() => setShowConfirmSubmit(true)} className="bg-accent hover:bg-accent/90 gap-2 font-bold px-8">
                  <Send className="h-4 w-4" /> Finalizar Exame
                </Button>
              ) : (
                <Button onClick={() => setCurrentIdx(prev => prev + 1)} className="gap-2 px-8">
                  Próxima <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Dialog de Confirmação */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border/50 shadow-2xl">
            <CardHeader className="text-center">
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
              <CardTitle>Deseja entregar agora?</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Você respondeu {answeredCount} de {questions.length} questões. 
              {answeredCount < questions.length && <p className="mt-2 text-destructive font-bold">Existem questões em branco!</p>}
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirmSubmit(false)}>Continuar Revisando</Button>
              <Button variant="destructive" className="flex-1 font-bold" onClick={submitSimulation}>Sim, Entregar</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
