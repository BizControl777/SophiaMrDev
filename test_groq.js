const { groq } = require("@ai-sdk/groq");
const { generateText } = require("ai");
require("dotenv").config({ path: "apps/backend/.env" });

async function test() {
  try {
    console.log("Testing Groq API...");
    console.log("Model: llama-3.3-70b-versatile");
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: "Olá, você está funcionando?",
    });
    console.log("Response:", text);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
