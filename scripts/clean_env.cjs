const fs = require('fs');
const content = fs.readFileSync('.env', 'utf8');
const lines = content.split(/\r?\n/);
const filtered = lines.filter(line => {
  const clean = line.replace(/\s/g, '');
  return !clean.includes('DEEPSEEK');
});
filtered.push('DEEPSEEK_API_KEY=sk-eff1aa8acef3479188a99e14e646a650');
fs.writeFileSync('.env', filtered.join('\n'));
console.log('Env cleaned with Node.');
