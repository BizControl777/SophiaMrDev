// Integração com API do M-Pesa (Vodacom Moçambique)

export type MPesaResult =
  | { success: true; transactionId: string; simulated?: boolean }
  | { success: false; error: string }

function allowSimulation(): boolean {
  if (process.env.NODE_ENV === "production") return false
  if (process.env.VERCEL_ENV === "production") return false
  return process.env.ALLOW_MPESA_SIMULATION === "true"
}

export async function initiateMPesaPayment(
  phoneNumber: string,
  amount: number,
  reference: string
): Promise<MPesaResult> {
  const host = process.env.MPESA_API_HOST || "api.sandbox.vm.co.mz"
  const apiKey = process.env.MPESA_API_KEY

  if (!apiKey) {
    if (!allowSimulation()) {
      return {
        success: false,
        error:
          "M-Pesa não configurado. Defina MPESA_API_KEY ou ALLOW_MPESA_SIMULATION=true (apenas não-produção).",
      }
    }
    console.warn("[MPESA] Simulação de pagamento (ALLOW_MPESA_SIMULATION=true)")
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      success: true,
      simulated: true,
      transactionId: "MPESA_SIM_" + Math.random().toString(36).slice(2, 11).toUpperCase(),
    }
  }

  try {
    const response = await fetch(`https://${host}/ipg/v1x/c2bPayment/singleStage/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Origin: "developer.mpesa.vm.co.mz",
      },
      body: JSON.stringify({
        input_TransactionReference: reference,
        input_CustomerMSISDN: phoneNumber,
        input_Amount: amount.toString(),
        input_ThirdPartyReference: "SophIA_" + reference,
        input_ServiceProviderCode: process.env.MPESA_SERVICE_PROVIDER_CODE,
      }),
    })

    const data = await response.json()
    if (data.output_ResponseCode === "INS-0") {
      return {
        success: true,
        transactionId: data.output_TransactionID || reference,
      }
    }
    return {
      success: false,
      error: data.output_ResponseDesc || "Pagamento M-Pesa recusado",
    }
  } catch (error) {
    console.error("[MPESA] Erro na integração", error)
    return { success: false, error: "Falha ao contactar o gateway M-Pesa" }
  }
}
