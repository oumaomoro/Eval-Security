import OpenAI from "openai";

async function testOllama() {
  console.log("Testing Ollama connection...");
  try {
    const openai = new OpenAI({
      apiKey: "ollama",
      baseURL: "http://127.0.0.1:11434/v1",
    });

    const response = await openai.chat.completions.create({
      model: "deepseek-r1:8b",
      messages: [{ role: "user", content: "Say HEALTH_OK" }],
    });

    console.log("Response:", response.choices[0]?.message?.content);
  } catch (err: any) {
    console.error("Connection failed:", err.message);
  }
}

testOllama();
