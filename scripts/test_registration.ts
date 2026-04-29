import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_URL = "http://127.0.0.1:3200";

async function testRegistration() {
  console.log("--- 🧪 TESTING USER REGISTRATION API ---");
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email: "0moroouma1@gmail.com",
      password: "File75555@gmail.com",
      firstName: "Jack",
      lastName: "Ouma"
    });

    console.log("✅ [SUCCESS] Registration Response:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error("❌ [FAIL] Registration Failed:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`Message: ${error.message}`);
    }
    process.exit(1);
  }
}

testRegistration();
