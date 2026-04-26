const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.ulercnwyckrcjcnrenzz:bU2LA8gMGSv!!k*@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('remediation_tasks','remediation_suggestions') ORDER BY table_name"
  ))
  .then(r => {
    if (r.rows.length === 2) {
      console.log('OK: Both tables confirmed in Supabase:');
      r.rows.forEach(row => console.log(' -', row.table_name));
    } else {
      console.log('WARNING: Only found:', r.rows.map(r => r.table_name).join(', ') || 'none');
    }
    client.end();
  })
  .catch(e => { console.error('DB error:', e.message); client.end(); process.exit(1); });
