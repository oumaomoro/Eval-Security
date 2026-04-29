import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_URL = "http://127.0.0.1:3200";

async function testLogin() {
  console.log("--- 🧪 TESTING USER LOGIN API ---");
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: "0moroouma1@gmail.com",
      password: "File75555@gmail.com"
    });

    console.log("✅ [SUCCESS] Login Response:", JSON.stringify(response.data, null, 2));
    console.log("--- Set-Cookie Header ---");
    console.log(response.headers['set-cookie']);
  } catch (error: any) {
    console.error("❌ [FAIL] Login Failed:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`Message: ${error.message}`);
    }
    process.exit(1);
  }
}

testLogin();
