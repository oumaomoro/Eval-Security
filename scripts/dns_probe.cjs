const dns = require('dns');

const projectRef = "ulercnwyckrcjcnrenzz";
const patterns = [
  `${projectRef}.supabase.co`,
  `db.${projectRef}.supabase.co`,
  `${projectRef}.supabase.com`,
  `db.${projectRef}.supabase.com`,
  `db.${projectRef}.supabase.net`
];

console.log(`🔍 Probing DNS for project: ${projectRef}...`);

patterns.forEach(host => {
  dns.lookup(host, (err, address, family) => {
    if (err) {
      console.log(`❌ ${host}: Not Found`);
    } else {
      console.log(`✅ ${host}: ${address} (Family: ${family})`);
    }
  });
});
