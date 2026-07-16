import { Prisma } from "@prisma/client"

type Tx = Prisma.TransactionClient

export class InsufficientBalanceError extends Error {
  constructor(message = "Saldo insuficiente") {
    super(message)
    this.name = "InsufficientBalanceError"
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

/** Credit (or debit if amount negative). No-op if `reference` already exists. */
export async function applyBalanceOnce(
  tx: Tx,
  opts: {
    userId: string
    amount: number
    type: string
    reference: string
    meta?: string
  }
): Promise<{ applied: boolean }> {
  if (opts.amount === 0) return { applied: false }

  try {
    await tx.balanceTransaction.create({
      data: {
        userId: opts.userId,
        amount: opts.amount,
        type: opts.type,
        reference: opts.reference,
        meta: opts.meta ?? null,
      },
    })
  } catch (error) {
    if (isUniqueViolation(error)) return { applied: false }
    throw error
  }

  await tx.user.update({
    where: { id: opts.userId },
    data: { balance: { increment: opts.amount } },
  })

  return { applied: true }
}

/**
 * Debit only if balance covers it. Uses an atomic UPDATE ... WHERE balance >= amount
 * so concurrent debitOnce calls cannot drive the balance negative.
 */
export async function debitOnce(
  tx: Tx,
  opts: {
    userId: string
    amount: number
    type: string
    reference: string
    meta?: string
  }
): Promise<{ applied: boolean }> {
  if (opts.amount <= 0) return { applied: false }

  try {
    await tx.balanceTransaction.create({
      data: {
        userId: opts.userId,
        amount: -opts.amount,
        type: opts.type,
        reference: opts.reference,
        meta: opts.meta ?? null,
      },
    })
  } catch (error) {
    if (isUniqueViolation(error)) return { applied: false }
    throw error
  }

  // Atomic conditional debit — prevents TOCTOU races under concurrent holds/bets
  const decremented = await tx.user.updateMany({
    where: {
      id: opts.userId,
      balance: { gte: opts.amount },
    },
    data: { balance: { decrement: opts.amount } },
  })

  if (decremented.count === 0) {
    await tx.balanceTransaction.delete({ where: { reference: opts.reference } })
    throw new InsufficientBalanceError()
  }

  return { applied: true }
}
