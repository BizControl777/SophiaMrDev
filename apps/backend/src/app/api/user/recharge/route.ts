import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { initiateMPesaPayment } from "@/lib/mpesa"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, amount, phoneNumber } = body

    if (!userId || !amount || amount <= 0 || !phoneNumber) {
      return new NextResponse("Dados inválidos. É necessário o número de telefone e valor.", { status: 400 })
    }

    // 1. Iniciar requisição real de dinheiro com gateway (M-Pesa Push)
    const paymentResult = await initiateMPesaPayment(
      phoneNumber,
      amount,
      `REC_${userId}_${Date.now()}`
    )

    if (!paymentResult.success) {
      return new NextResponse("Falha ao debitar na conta M-Pesa. Transação negada.", { status: 402 }) // 402 Payment Required
    }

    // 2. Transação de dinheiro confirmada, adicionar saldo ao banco da SophIA
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: amount,
        },
      },
    })

    return NextResponse.json({ 
      user: updatedUser, 
      transactionId: paymentResult.transactionId,
      message: "Pagamento processado com sucesso!"
    })
  } catch (error) {
    console.error("[RECHARGE_POST_MPESA]", error)
    return new NextResponse("Erro Interno do Servidor", { status: 500 })
  }
}
