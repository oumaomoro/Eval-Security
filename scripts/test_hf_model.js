const fetch = require('node-fetch');
require('dotenv').config();

async function testHFModel() {
  const hfToken = process.env.HF_TOKEN;
  const modelId = process.env.HF_MODEL_ID || "your-username/costloci-kdpa-llama3";

  if (!hfToken || hfToken === "missing") {
    console.error("❌ HF_TOKEN is missing in environment.");
    return;
  }

  const query = "The vendor shall keep data for 15 years.";
  
  console.log(`📡 Testing HF Model: ${modelId}`);
  console.log(`📝 Query: ${query}`);

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `### Instruction: Analyze the following contract clause for KDPA/CBK compliance.\n### Input: ${query}\n### Output:`,
        parameters: { max_new_tokens: 256, return_full_text: false }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Response Received:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Test Failed:", error.message);
  }
}

testHFModel();
