const http = require('http');

const data = JSON.stringify({
  email: "test_onboard_debug@test.com",
  password: "Password123!",
  firstName: "Test",
  lastName: "User"
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, '\nBODY:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
