const SUPABASE_URL = "https://ulercnwyckrcjcnrenzz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZXJjbnd5Y2tyY2pjbnJlbnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTMwMDUsImV4cCI6MjA4NjcyOTAwNX0.TBOo9DereNkd2ejJ9AHCMg1-TuQbg_dSC3SNQsXNo5o";

async function checkColumns() {
  console.log("Checking columns for 'profiles' table...");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    if (data.length > 0) {
      console.log("SUCCESS! Columns found:", Object.keys(data[0]));
    } else {
      console.log("SUCCESS but table is empty. Trying to trigger a schema error to see columns...");
      const errResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=non_existent_column`, {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const errData = await errResponse.json();
      console.log("Error message (should contain column list):", errData.message);
    }
  } else {
    const err = await response.json();
    console.error("FAILED to fetch:", err.message);
  }
}

checkColumns();
