import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as Blob | null

    if (!file) {
      return new NextResponse("Arquivo não fornecido.", { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Usar require dinâmico para evitar problemas com Turbopack/ESM
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse/lib/pdf-parse.js")

    const data = await pdfParse(buffer)
    const text = data.text

    if (!text || text.trim().length === 0) {
      return new NextResponse("Nenhum texto pôde ser extraído deste PDF.", { status: 400 })
    }

    return NextResponse.json({ text: text.trim() })
  } catch (error: any) {
    console.error("[PDF_EXTRACT_ERROR]:", error)
    return new NextResponse("Erro ao processar PDF: " + error.message, { status: 500 })
  }
}
