import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { initiateMPesaPayment } from "@/lib/mpesa"
import { requireAuth } from "@/lib/api-auth"
import { applyBalanceOnce } from "@/lib/balance"
import { stripPassword } from "@/lib/auth"

const MIN_AMOUNT = 1
const MAX_AMOUNT = 50_000

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const userId = session.sub
    const amount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount)
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : ""

    if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT || !phoneNumber) {
      return new NextResponse(
        `Dados inválidos. Telefone obrigatório; valor entre ${MIN_AMOUNT} e ${MAX_AMOUNT} MT.`,
        { status: 400 }
      )
    }

    const reference = `REC_${userId}_${Date.now()}`
    const paymentResult = await initiateMPesaPayment(phoneNumber, amount, reference)

    if (!paymentResult.success) {
      return new NextResponse(paymentResult.error, { status: 402 })
    }

    // Ledger reference uses provider transaction id so retries of the same payment don't double-credit
    const ledgerRef = `recharge:${paymentResult.transactionId}`

    const updatedUser = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const { applied } = await applyBalanceOnce(tx, {
        userId,
        amount,
        type: "RECHARGE",
        reference: ledgerRef,
        meta: JSON.stringify({
          phoneNumber,
          simulated: paymentResult.simulated ?? false,
        }),
      })

      const user = await tx.user.findUnique({ where: { id: userId } })
      if (!user) throw new Error("USER_NOT_FOUND")
      return { user, applied }
    })

    return NextResponse.json({
      user: stripPassword(updatedUser.user),
      transactionId: paymentResult.transactionId,
      credited: updatedUser.applied,
      simulated: paymentResult.simulated ?? false,
      message: updatedUser.applied
        ? "Pagamento processado com sucesso!"
        : "Pagamento já tinha sido creditado (idempotente).",
    })
  } catch (error) {
    console.error("[RECHARGE_POST_MPESA]", error)
    return new NextResponse("Erro Interno do Servidor", { status: 500 })
  }
}
