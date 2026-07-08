// Integração com API do M-Pesa (Vodacom Moçambique) para Dinheiro Real

export async function initiateMPesaPayment(phoneNumber: string, amount: number, reference: string) {
  // ATENÇÃO: Para funcionar com dinheiro real, você precisa configurar estas variáveis de ambiente (.env):
  // MPESA_API_HOST=api.sandbox.vm.co.mz (ou api.vm.co.mz para produção)
  // MPESA_API_KEY=sua_api_key_fornecida_pela_vodacom
  // MPESA_PUBLIC_KEY=sua_public_key
  // MPESA_SERVICE_PROVIDER_CODE=171717 (Seu código de negócio)
  
  const host = process.env.MPESA_API_HOST || "api.sandbox.vm.co.mz"
  const apiKey = process.env.MPESA_API_KEY
  
  if (!apiKey) {
    console.warn("Chaves do M-Pesa não encontradas no .env. Executando simulação de sucesso para ambiente local.")
    // Simular o delay de uma requisição real de Push/USSD (M-Pesa pedir PIN ao usuário)
    await new Promise(resolve => setTimeout(resolve, 2500))
    return { success: true, transactionId: "MPESA_TX_" + Math.random().toString(36).substr(2, 9).toUpperCase() }
  }

  // Lógica de integração com a API real do M-Pesa (C2B / Push Request)
  try {
    // Chamada real para a API do M-Pesa:
    const response = await fetch(`https://${host}/ipg/v1x/c2bPayment/singleStage/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Origin": "developer.mpesa.vm.co.mz"
      },
      body: JSON.stringify({
        input_TransactionReference: reference,
        input_CustomerMSISDN: phoneNumber, // Número do cliente (ex: 84XXXXXXX)
        input_Amount: amount.toString(),
        input_ThirdPartyReference: "SophIA_" + reference,
        input_ServiceProviderCode: process.env.MPESA_SERVICE_PROVIDER_CODE
      })
    })
    
    const data = await response.json()
    // O código 'INS-0' indica sucesso na API da Vodacom M-Pesa Moçambique
    return { success: data.output_ResponseCode === 'INS-0', data, transactionId: data.output_TransactionID }
  } catch (error) {
    console.error("Erro na integração com gateway de pagamento", error)
    return { success: false, error }
  }
}
