import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import * as dotenv from "dotenv";
import path from "path";

// Carregar .env explicitamente
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  
  console.log("--- Diagnóstico de IA SophIA (GROQ) ---");
  console.log("Verificando chave de API...");
  
  if (!apiKey) {
    console.error("ERRO: GROQ_API_KEY não encontrada no .env");
    return;
  }
  
  console.log(`Chave encontrada: ${apiKey.substring(0, 8)}...`);
  
  try {
    console.log("Enviando comando de teste para Groq (Llama-3)...");
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: "Olá! Você está ativo? Responda apenas com 'SOPHIA_ACTIVE'",
    });
    
    console.log("Resposta da IA:", text);
    if (text.includes("SOPHIA_ACTIVE")) {
      console.log("✅ SUCESSO: A IA está respondendo corretamente via Groq!");
    } else {
      console.log("⚠️ AVISO: A IA respondeu, mas não no formato esperado.");
    }
  } catch (error: any) {
    console.error("❌ ERRO ao conectar com Groq:");
    console.error(error.message);
  }
}

testGroq();
