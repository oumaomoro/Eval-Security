async function verifyServerIdentity() {
  console.log("🔍 Checking Server Identity after 'pconfirmed' restart...");
  
  try {
    const res = await fetch("http://127.0.0.1:3001/api/auth/user");
    const status = res.headers.get("X-P25-Status");
    
    if (status === "Harmonized-V1") {
      console.log("✅ SERVER IS UP-TO-DATE: Found 'Harmonized-V1' header.");
    } else {
      console.log("❌ SERVER IS STALE: Header 'X-P25-Status' not found.");
      console.log("This proves the server is still running an old version of the code and missed your restart.");
    }
  } catch (err: any) {
    console.log("⚠️ Server unreachable or refused connection. This might happen during a restart.");
  }
}

verifyServerIdentity();
