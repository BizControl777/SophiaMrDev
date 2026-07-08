import PDFDocument from "pdfkit"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, questions } = body

    if (!questions || !Array.isArray(questions)) {
      return new NextResponse("O campo questions eh obrigatorio e deve ser um array.", { status: 400 })
    }

    // Cria o documento PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" })
    
    // Converte o PDF em um array buffer para poder retornar como Resposta HTTP
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(chunk))
    
    const endPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)))
    })

    // Cabeçalho estilo UEM
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("UNIVERSIDADE EDUARDO MONDLANE", { align: "center" })
    
    doc
      .fontSize(12)
      .text("COMISSAO DE EXAMES DE ADMISSAO", { align: "center" })
    
    doc.moveDown()
    
    doc
      .fontSize(16)
      .text((title || "EXAME DE ADMISSAO").toUpperCase(), { align: "center" })
    
    doc.moveDown(2)

    // Instruções (Opcional, estilo exame)
    doc
      .fontSize(10)
      .font("Helvetica-Oblique")
      .text("Instrucoes: Leia atentamente as questoes e marque a alternativa correcta.", { align: "center" })
      
    doc.moveDown(2)

    // Corpo das questões
    doc.fontSize(11).font("Helvetica")
    const labels = ["A)", "B)", "C)", "D)"]

    questions.forEach((q: any, index: number) => {
      // Pergunta
      doc.font("Helvetica-Bold").text(`${index + 1}. ${q.question}`)
      doc.moveDown(0.5)

      // Alternativas
      doc.font("Helvetica")
      if (Array.isArray(q.options)) {
        q.options.forEach((opt: string, i: number) => {
          doc.text(`    ${labels[i] || "-"} ${opt}`)
        })
      }
      doc.moveDown(1.5)
    })

    // Finaliza o documento
    doc.end()

    const pdfBuffer = await endPromise

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="exame.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("[PDF_ERROR]:", error)
    return new NextResponse("Erro interno ao gerar PDF: " + error.message, { status: 500 })
  }
}
