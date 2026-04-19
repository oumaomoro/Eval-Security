import fetch from "node-fetch";

async function checkColumns() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.error("Missing env vars");
    process.exit(1);
  }

  const res = await fetch(`${url}/rest/v1/clients?limit=1`, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Accept": "application/json",
      "Prefer": "return=representation"
    }
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

checkColumns();
