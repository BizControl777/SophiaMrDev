import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export const maxDuration = 60

function extractJSON(raw: string): string {
  let text = raw.trim()
  // Remove blocos markdown
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
  // Extrai só o objeto JSON
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) {
    throw new Error("A IA nao retornou um JSON valido.")
  }
  return text.slice(start, end + 1)
}

/** Gera um lote de até 10 questões sobre o tema */
async function generateBatch(theme: string, batchCount: number, startId: number): Promise<any[]> {
  const prompt =
    "Gere exatamente " + batchCount + " questoes de multipla escolha academicas sobre: " + theme + ". " +
    "Retorne SOMENTE um array JSON valido, sem texto adicional, sem markdown. " +
    "Formato obrigatorio: " +
    '[{"id":' + startId + ',"question":"Enunciado da questao","options":["Opcao A","Opcao B","Opcao C","Opcao D"],"correctAnswer":0,"explanation":"Explicacao"}] ' +
    "Regras: " +
    "1. correctAnswer e um numero de 0 a 3. " +
    "2. Cada questao tem exatamente 4 opcoes. " +
    "3. Nao use aspas duplas dentro dos textos — use aspas simples se necessario. " +
    "4. Use portugues de Mocambique. " +
    "5. O resultado deve ser um array JSON puro parseavel com JSON.parse."

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt,
  })

  let cleaned = text.trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")

  // Extrai o array: do primeiro '[' ao último ']'
  const arrStart = cleaned.indexOf("[")
  const arrEnd = cleaned.lastIndexOf("]")
  if (arrStart === -1 || arrEnd === -1) {
    // Tenta extrair como objeto com campo questions
    const obj = JSON.parse(extractJSON(cleaned))
    return Array.isArray(obj.questions) ? obj.questions : []
  }

  return JSON.parse(cleaned.slice(arrStart, arrEnd + 1))
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const theme: string = body.theme ?? "Matematica"
    const count: number = Math.min(Math.max(Number(body.count) || 5, 1), 60)

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: "GROQ_API_KEY nao configurada" }, { status: 500 })
    }

    const BATCH_SIZE = 10
    const allQuestions: any[] = []

    // Gera em lotes de no máximo 10 questões para evitar JSON corrompido
    let remaining = count
    let startId = 1
    while (remaining > 0) {
      const batchCount = Math.min(remaining, BATCH_SIZE)
      const batch = await generateBatch(theme, batchCount, startId)
      for (const q of batch) {
        allQuestions.push({
          id: startId,
          question: String(q.question ?? "Questao sem enunciado"),
          options: Array.isArray(q.options) ? q.options.map(String) : ["A", "B", "C", "D"],
          correctAnswer: Number(q.correctAnswer ?? 0),
          explanation: String(q.explanation ?? ""),
        })
        startId++
      }
      remaining -= batchCount
    }

    return Response.json({
      title: "Simulado de " + theme,
      questions: allQuestions,
    })
  } catch (error: any) {
    console.error("[EXAMES_GENERATE_ERROR]:", error)
    return Response.json({ error: error.message ?? "Erro interno ao gerar exame." }, { status: 500 })
  }
}
