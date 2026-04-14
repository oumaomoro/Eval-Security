const fs = require('fs');
const file = process.argv[2] || 'error.log';
try {
  let log = fs.readFileSync(file);
  if (log[0] === 0xFF && log[1] === 0xFE) {
     log = log.toString('utf16le');
  } else {
     log = log.toString('utf8');
  }
  console.log(log);
} catch(e) {
  console.error("Error reading file", e.message);
}
