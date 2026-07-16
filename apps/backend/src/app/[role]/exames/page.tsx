"use client"

import { authFetch } from "@/lib/auth-fetch"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  ArrowRight, 
  Loader2, 
  RefreshCcw, 
  History, 
  FileText, 
  Lock, 
  Unlock,
  Sparkles,
  Search
} from "lucide-react"

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  explanation?: string
  topic?: string
}

interface Exam {
  id: string
  title: string
  subject: string
  questions: Question[]
  isOld?: boolean
}

import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { useEffect } from "react"
import { SimulationEnvironment } from "@/components/dashboard/simulation-environment"

export default function ExamesPage() {
  const { user, role } = useAuth()
  const [view, setView] = useState<"menu" | "config" | "taking_exam" | "challenge" | "resolution" | "simulation">("menu")
  const [oldExams, setOldExams] = useState<Exam[]>([])
  const [aiExams, setAiExams] = useState<Exam[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  
  // Proteção de Rota
  if (role !== 'STUDENT') {
// ... rest of the guard
  }

  const [theme, setTheme] = useState("")
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [pendingResolutionExam, setPendingResolutionExam] = useState<Exam | null>(null)
  const [challengeScore, setChallengeScore] = useState(0)
  const [challengeQuestions, setChallengeQuestions] = useState<Question[]>([])
  const [challengeSubject, setChallengeSubject] = useState("")

  // Configuração do simulado
  const [pendingTheme, setPendingTheme] = useState("")
  const [selectedCount, setSelectedCount] = useState(10)
  const [selectedDuration, setSelectedDuration] = useState(30)

  // Detalhes da Simulação
  const [simulationResults, setSimulationResults] = useState<{ score: number, total: number, timeSpent: number } | null>(null)
  const [examTimeLimit, setExamTimeLimit] = useState(30)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExams()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchExams = async () => {
    try {
      const [oldRes, aiRes] = await Promise.all([
        authFetch(`/api/exames?isOld=true&search=${searchTerm}`),
        authFetch(`/api/exames?isOld=false&search=${searchTerm}`)
      ])
      
      if (!oldRes.ok || !aiRes.ok) {
        throw new Error("Falha ao carregar exames do servidor.")
      }

      const oldData = await oldRes.json()
      const aiData = await aiRes.json()
      setOldExams(Array.isArray(oldData) ? oldData : [])
      setAiExams(Array.isArray(aiData) ? aiData : [])
    } catch (error) {
      console.error("Error fetching exams:", error)
      setOldExams([])
      setAiExams([])
    }
  }

  const openConfig = (selectedTheme: string) => {
    setPendingTheme(selectedTheme)
    setSelectedCount(10)
    setSelectedDuration(30)
    setView("config")
  }

  const generateExam = async (selectedTheme: string, count: number, timeLimit: number, isSimilar = false) => {
    setLoading(true)
    setExam(null)
    setFinished(false)
    setScore(0)
    setCurrentQuestionIndex(0)
    setExamTimeLimit(timeLimit)
    setView("taking_exam")
    
    try {
      const res = await authFetch("/api/exames/generate", {
        method: "POST",
        body: JSON.stringify({ 
          theme: selectedTheme,
          count: isSimilar ? 5 : count
        }),
        headers: { "Content-Type": "application/json" }
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Falha ao gerar exame com IA")
      }

      const data = await res.json()
      
      if (!data.questions) {
        throw new Error("O servidor retornou um exame sem questões.")
      }

      // Adaptar resposta da IA para o novo modelo de questões
      const formattedQuestions = data.questions.map((q: any) => ({
        id: q.id.toString(),
        text: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }))

      setExam({ ...data, questions: formattedQuestions, id: data.databaseId, subject: selectedTheme })
      fetchExams() 
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Erro ao gerar exame. Tente novamente.")
      setView("menu")
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async (examToDownload: Exam) => {
    try {
      const res = await authFetch("/api/exames/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examToDownload.title,
          questions: examToDownload.questions
        })
      });
      if (!res.ok) throw new Error("Erro ao gerar PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${examToDownload.title || "exame"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Falha ao baixar PDF.");
    }
  }

  const startOldExam = (oldExam: Exam) => {
    setExam(oldExam)
    setView("simulation")
  }

  const handleSimulationComplete = async (results: { score: number, total: number, timeSpent: number }) => {
    setSimulationResults(results)
    setView("menu")
    
    // Salvar resultado no banco
    if (user?.id && exam) {
      try {
        await authFetch("/api/simulations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            title: exam.title,
            subject: exam.subject,
            score: results.score,
            totalQuestions: results.total,
            timeSpent: results.timeSpent,
            results: {} // Opcional: guardar respostas detalhadas
          })
        })
      } catch (error) {
        console.error("Error saving simulation:", error)
      }
    }
  }

  if (view === "config") {
    const questionOptions = [5, 10, 15, 20, 30, 40, 50, 60]
    const durationOptions = [
      { label: "15 min", value: 15 },
      { label: "30 min", value: 30 },
      { label: "45 min", value: 45 },
      { label: "1 hora", value: 60 },
      { label: "1h30", value: 90 },
      { label: "2 horas", value: 120 },
    ]
    return (
      <div className="max-w-xl mx-auto">
        <Card className="border-border/50 bg-muted/30">
          <CardHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Configurar Simulado</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Personaliza o teu exame antes de começar</p>
              </div>
            </div>
            <Badge variant="outline" className="w-fit mt-2 bg-primary/10 text-primary border-primary/20 text-xs">
              📚 Tema: {pendingTheme}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Número de Questões */}
            <div className="space-y-3">
              <Label className="text-sm font-bold flex items-center gap-2">
                📋 Número de Questões
                <span className="ml-auto text-primary font-mono text-lg">{selectedCount}</span>
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {questionOptions.map(n => (
                  <button
                    key={n}
                    onClick={() => setSelectedCount(n)}
                    className={`py-2 rounded-lg border text-sm font-bold transition-all ${
                      selectedCount === n
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                        : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">Máximo de 60 questões por simulado.</p>
            </div>

            {/* Duração */}
            <div className="space-y-3">
              <Label className="text-sm font-bold flex items-center gap-2">
                ⏱️ Duração do Simulado
                <span className="ml-auto text-primary font-mono text-lg">{selectedDuration} min</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {durationOptions.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    className={`py-2 rounded-lg border text-sm font-bold transition-all ${
                      selectedDuration === d.value
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                        : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumo */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{selectedCount} questões</span> · <span className="font-bold text-foreground">{selectedDuration} minutos</span>
                <br />Ritmo: ~{Math.round(selectedDuration / selectedCount * 60)}s por questão
              </div>
              <div className="text-2xl">🎯</div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setView("menu")}>
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2 font-bold"
              onClick={() => generateExam(pendingTheme, selectedCount, selectedDuration)}
            >
              <Sparkles className="h-4 w-4" />
              Gerar Simulado
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (view === "simulation" && exam) {
    return (
      <SimulationEnvironment 
        title={exam.title}
        subject={exam.subject}
        questions={exam.questions}
        timeLimit={examTimeLimit}
        onComplete={handleSimulationComplete}
        onClose={() => setView("menu")}
      />
    )
  }

  const startChallenge = (examToUnlock: Exam) => {
    setPendingResolutionExam(examToUnlock)
    setView("challenge")
    setChallengeScore(0)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  const generateChallengeQuestions = async (subject: string) => {
    setLoading(true)
    setChallengeSubject(subject)
    try {
      const res = await authFetch("/api/exames/generate", {
        method: "POST",
        body: JSON.stringify({ theme: subject, count: 3, difficulty: "difícil" }),
        headers: { "Content-Type": "application/json" }
      })
      const data = await res.json()
      setChallengeQuestions(data.questions)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = () => {
    if (selectedAnswer === null) return

    if (view === "taking_exam" && exam) {
      const isCorrect = selectedAnswer === exam.questions[currentQuestionIndex].correctAnswer
      if (isCorrect) setScore(s => s + 1)
      setShowResult(true)
    } else if (view === "challenge") {
      const isCorrect = selectedAnswer === challengeQuestions[currentQuestionIndex].correctAnswer
      if (isCorrect) setChallengeScore(s => s + 1)
      setShowResult(true)
    }
  }

  const nextQuestion = () => {
    if (view === "taking_exam" && exam) {
      if (currentQuestionIndex < exam.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setShowResult(false)
      } else {
        setFinished(true)
      }
    } else if (view === "challenge") {
      if (currentQuestionIndex < challengeQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setShowResult(false)
      } else {
        if (challengeScore + (selectedAnswer === challengeQuestions[currentQuestionIndex].correctAnswer ? 1 : 0) === 3) {
          setView("resolution")
          setExam(pendingResolutionExam)
        } else {
          alert("Você precisa acertar as 3 questões para desbloquear a resolução!")
          setView("menu")
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-mono text-sm animate-pulse">
          {view === "challenge" ? "Gerando desafio de segurança..." : "Preparando exame..."}
        </p>
      </div>
    )
  }

  if (view === "resolution" && exam) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-2xl font-bold">Resolução: {exam.title}</h2>
          <Button variant="outline" onClick={() => setView("menu")}>Voltar ao Menu</Button>
        </div>
        
        {exam.questions.map((q, idx) => (
          <Card key={idx} className="border-border/50 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Questão {idx + 1}: {q.text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {q.options.map((opt, i) => (
                  <div key={i} className={`p-3 rounded-md border ${i === q.correctAnswer ? "bg-accent/20 border-accent" : "bg-background/50 border-border/50"}`}>
                    <span className="text-sm">{opt}</span>
                    {i === q.correctAnswer && <CheckCircle2 className="h-4 w-4 text-accent inline ml-2" />}
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-bold text-primary uppercase mb-1">Explicação Detalhada:</p>
                <p className="text-sm leading-relaxed">{q.explanation}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (view === "challenge" && (!challengeQuestions || challengeQuestions.length === 0)) {
    return (
      <Card className="max-w-md mx-auto border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Desafio de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para ver a resolução deste exame antigo, você deve primeiro provar seus conhecimentos acertando 3 questões de nível difícil.
          </p>
          <div className="space-y-2">
            <Label>Escolha a disciplina do desafio:</Label>
            <div className="grid grid-cols-2 gap-2">
              {["Matemática", "Física", "Química", "Biologia", "Português"].map(s => (
                <Button key={s} variant="outline" size="sm" onClick={() => generateChallengeQuestions(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full" onClick={() => setView("menu")}>Cancelar</Button>
        </CardFooter>
      </Card>
    )
  }

  const isTakingExam = view === "taking_exam" && exam && exam.questions && exam.questions.length > 0
  const isChallenge = view === "challenge" && challengeQuestions && challengeQuestions.length > 0

  if (isTakingExam || isChallenge) {
    const questions = view === "taking_exam" ? exam!.questions : challengeQuestions
    const q = questions[currentQuestionIndex]
    if (!q) return null // Segurança adicional
    
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    if (finished && view === "taking_exam") {
      const percentage = (score / exam!.questions.length) * 100
      return (
        <Card className="max-w-2xl mx-auto border-border/50 bg-muted/30">
          <CardContent className="pt-12 pb-8 text-center flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold font-mono mb-2">Exame Concluído!</h2>
            <p className="text-muted-foreground mb-8">Você completou o exame sobre {exam!.title}</p>
            
            <div className="grid grid-cols-2 gap-8 w-full mb-8">
              <div className="bg-card p-4 rounded-xl border border-border/50">
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Nota Final</div>
                <div className="text-3xl font-bold font-mono">{percentage.toFixed(0)}%</div>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border/50">
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Acertos</div>
                <div className="text-3xl font-bold font-mono">{score}/{exam!.questions.length}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Button className="w-full gap-2 font-bold h-12 bg-accent hover:bg-accent/90 text-white" onClick={() => downloadPDF(exam!)}>
                Baixar PDF Oficial
              </Button>
              <Button className="w-full gap-2 font-bold h-12" onClick={() => setView("menu")}>
                <RefreshCcw className="h-4 w-4" /> Voltar ao Menu
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2 border-primary text-primary hover:bg-primary/10 h-12"
                onClick={() => openConfig(exam!.subject)}
              >
                <Sparkles className="h-4 w-4" /> Gerar Exame Similar
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <Badge variant="outline" className="w-fit mb-1 bg-primary/10 text-primary border-primary/20">
              {view === "challenge" ? "DESAFIO DE ACESSO" : "EXAME EM CURSO"}
            </Badge>
            <h2 className="font-mono text-lg font-bold truncate">
              {view === "challenge" ? `Disciplina: ${challengeSubject}` : exam!.title}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-muted-foreground">Questão {currentQuestionIndex + 1} de {questions.length}</span>
            {view === "taking_exam" && (
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => downloadPDF(exam!)}>
                Baixar PDF Oficial
              </Button>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />

        <Card className="border-border/50 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">{q.text}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={selectedAnswer?.toString()} 
              onValueChange={(v) => !showResult && setSelectedAnswer(parseInt(v))}
              className="space-y-3"
            >
              {q.options.map((opt, i) => (
                <div 
                  key={i}
                  className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                    showResult 
                      ? i === q.correctAnswer 
                        ? "bg-accent/10 border-accent/50" 
                        : i === selectedAnswer 
                          ? "bg-destructive/10 border-destructive/50" 
                          : "opacity-50"
                      : "hover:bg-muted/50 cursor-pointer"
                  }`}
                  onClick={() => !showResult && setSelectedAnswer(i)}
                >
                  <RadioGroupItem value={i.toString()} id={`opt-${i}`} disabled={showResult} />
                  <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer font-medium">{opt}</Label>
                  {showResult && i === q.correctAnswer && <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />}
                  {showResult && i === selectedAnswer && i !== q.correctAnswer && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                </div>
              ))}
            </RadioGroup>

            {showResult && (
              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-bold text-primary uppercase mb-1">Explicação:</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{q.explanation}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {!showResult ? (
              <Button 
                className="w-full font-bold h-12" 
                disabled={selectedAnswer === null}
                onClick={handleAnswer}
              >
                Confirmar Resposta
              </Button>
            ) : (
              <Button className="w-full font-bold h-12 gap-2" onClick={nextQuestion}>
                {currentQuestionIndex < questions.length - 1 ? "Próxima Questão" : "Finalizar"} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5B6EF5] via-[#7B8AF8] to-[#07080F] p-8 md:p-12 shadow-2xl shadow-[#5B6EF5]/20">
        <div className="relative z-10">
          <Badge className="bg-white/20 text-white hover:bg-white/30 border-none backdrop-blur-md mb-4 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> IA Simulator Pro
          </Badge>
          <h2 className="font-mono text-4xl md:text-5xl font-black tracking-tight text-white mb-3 drop-shadow-sm">
            Exames SophIA.
          </h2>
          <p className="text-white/80 text-base md:text-lg max-w-xl font-medium">
            O teu centro de preparação de elite. Gera simulados adaptativos com IA ou resolve exames oficiais de admissão da UEM e UP.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute right-1/4 bottom-0 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl translate-y-1/2"></div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Gerador IA Card */}
          <Card className="border-none bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5B6EF5] to-[#F55B7A]"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#5B6EF5]/20 to-[#F55B7A]/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#5B6EF5]" />
                </div>
                Gerar Novo Simulado IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-muted-foreground ml-1 uppercase tracking-wider">Temas Populares</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["Matemática", "Física", "Química", "Biologia", "Geografia", "História"].map(t => (
                    <Button 
                      key={t} 
                      variant="outline" 
                      className="justify-start border-border/50 hover:border-[#5B6EF5]/50 hover:bg-[#5B6EF5]/5 transition-all duration-300 hover:scale-[1.02] h-12"
                      onClick={() => openConfig(t)}
                    >
                      <span className="font-semibold">{t}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40 dashed" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-background/80 backdrop-blur-sm px-4 text-muted-foreground rounded-full">Ou pesquisa livremente</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    className="w-full h-12 bg-background/50 border border-border/50 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6EF5]/50 transition-all"
                    placeholder="Ex: Termodinâmica e Calorimetria..."
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  />
                </div>
                <Button 
                  disabled={!theme} 
                  onClick={() => openConfig(theme)}
                  className="h-12 px-6 bg-gradient-to-r from-[#5B6EF5] to-[#7B8AF8] hover:opacity-90 transition-opacity font-bold rounded-xl shadow-lg shadow-[#5B6EF5]/30"
                >
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Exames Antigos Card */}
          <Card className="border-border/30 bg-card/60 backdrop-blur-md shadow-lg shadow-black/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <History className="h-4 w-4 text-orange-500" />
                </div>
                Repositório Oficial
              </CardTitle>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar ano ou disciplina..." 
                  className="pl-9 h-9 text-xs bg-background/50 border-border/50 rounded-full focus-visible:ring-[#5B6EF5]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {oldExams.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Search className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium">Nenhum exame antigo encontrado.</p>
                    <p className="text-xs text-muted-foreground mt-1">Tenta pesquisar por outras palavras-chave.</p>
                  </div>
                )}
                {oldExams.map((old) => (
                  <div key={old.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-background hover:bg-muted/50 border border-border/40 transition-all duration-300 hover:shadow-md hover:border-[#5B6EF5]/30 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#5B6EF5]/10 to-transparent flex items-center justify-center text-[#5B6EF5] border border-[#5B6EF5]/20 group-hover:scale-110 transition-transform">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-bold group-hover:text-[#5B6EF5] transition-colors">{old.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider rounded-md">{old.subject}</Badge>
                          <span className="text-[10px] text-muted-foreground">{old.questions.length} questões</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs gap-1.5 h-9 rounded-xl hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/30 transition-colors"
                        onClick={() => startChallenge(old)}
                      >
                        <Lock className="h-3 w-3" /> Resolução
                      </Button>
                      <Button 
                        size="sm" 
                        className="text-xs bg-[#07080F] hover:bg-[#5B6EF5] text-white h-9 rounded-xl shadow-md transition-all"
                        onClick={() => startOldExam(old)}
                      >
                        Resolver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {aiExams.length > 0 && (
            <Card className="border-border/50 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" /> Simulações IA Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiExams.map((ai) => (
                    <div key={ai.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/20">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">{ai.title}</h4>
                          <p className="text-[10px] text-muted-foreground uppercase">{ai.subject}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="text-xs bg-accent hover:bg-accent/90"
                        onClick={() => startOldExam(ai)}
                      >
                        Praticar Novamente
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> Meu Desempenho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-black font-mono text-primary">0</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Exames Concluídos</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Média Geral</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-2xl bg-linear-to-br from-accent/20 to-primary/20 border border-accent/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white">
                <Unlock className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-sm">Garantia de Aprendizado</h4>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              O acesso às resoluções detalhadas de exames reais é bloqueado por um desafio. Isso garante que você está praticando ativamente antes de ver a resposta.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
