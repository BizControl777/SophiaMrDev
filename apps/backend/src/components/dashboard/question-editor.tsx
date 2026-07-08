"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Save, Plus, Trash2, HelpCircle, CheckCircle2, Loader2 } from "lucide-react"

export function QuestionEditor() {
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState({
    text: "",
    subject: "",
    topic: "",
    difficulty: "médio",
    university: "UEM",
    year: new Date().getFullYear().toString(),
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: ""
  })

  const updateOption = (index: number, value: string) => {
    const newOptions = [...question.options]
    newOptions[index] = value
    setQuestion({ ...question, options: newOptions })
  }

  const handleSave = async () => {
    if (!question.text || !question.subject || question.options.some(o => !o)) {
      alert("Por favor, preencha o enunciado e todas as opções.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...question,
          year: parseInt(question.year)
        })
      })

      if (response.ok) {
        alert("Questão salva com sucesso no banco de dados!")
        // Resetar formulário
        setQuestion({
          ...question,
          text: "",
          options: ["", "", "", ""],
          explanation: ""
        })
      } else {
        alert("Erro ao salvar questão.")
      }
    } catch (error) {
      console.error("Error saving question:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Editor Principal */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-border/50 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-mono uppercase flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" /> Enunciado da Questão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Texto da Pergunta</Label>
              <Textarea 
                placeholder="Digite o enunciado completo aqui..." 
                className="h-32 bg-card/50"
                value={question.text}
                onChange={(e) => setQuestion({...question, text: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <Label>Alternativas (Selecione a correta)</Label>
              <RadioGroup 
                value={question.correctAnswer.toString()} 
                onValueChange={(v) => setQuestion({...question, correctAnswer: parseInt(v)})}
                className="space-y-3"
              >
                {question.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <RadioGroupItem value={i.toString()} id={`r-${i}`} className="text-primary" />
                    <Input 
                      placeholder={`Opção ${i + 1}`} 
                      className="bg-card/50"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-mono uppercase">Explicação Pedagógica</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Explique por que a alternativa selecionada é a correta..." 
              className="h-24 bg-card/50"
              value={question.explanation}
              onChange={(e) => setQuestion({...question, explanation: e.target.value})}
            />
          </CardContent>
        </Card>
      </div>

      {/* Configurações e Metadados */}
      <div className="space-y-6">
        <Card className="border-border/50 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-mono uppercase">Classificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select onValueChange={(v) => setQuestion({...question, subject: v})}>
                <SelectTrigger className="bg-card/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matemática">Matemática</SelectItem>
                  <SelectItem value="Física">Física</SelectItem>
                  <SelectItem value="Química">Química</SelectItem>
                  <SelectItem value="Biologia">Biologia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select defaultValue="médio" onValueChange={(v) => setQuestion({...question, difficulty: v})}>
                <SelectTrigger className="bg-card/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fácil">Fácil</SelectItem>
                  <SelectItem value="médio">Médio</SelectItem>
                  <SelectItem value="difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instituição</Label>
                <Input 
                  value={question.university} 
                  onChange={(e) => setQuestion({...question, university: e.target.value})}
                  className="bg-card/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input 
                  type="number"
                  value={question.year} 
                  onChange={(e) => setQuestion({...question, year: e.target.value})}
                  className="bg-card/50"
                />
              </div>
            </div>

            <Button 
              className="w-full bg-primary hover:bg-primary/90 gap-2 h-12 font-bold" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Questão
            </Button>
          </CardContent>
        </Card>

        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
          <h4 className="text-xs font-bold uppercase text-accent mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3" /> Dica do Tutor
          </h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Questões com explicações detalhadas aumentam a retenção de aprendizado dos alunos em até 40%. Procure ser claro e conciso.
          </p>
        </div>
      </div>
    </div>
  )
}
