import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% of requests must be under 1.5s
  },
};

export default function () {
  const BASE_URL = 'https://api.costloci.com';
  
  // 1. Visit Landing Page
  const resHome = http.get(`${BASE_URL}/`);
  check(resHome, { 'status is 200': (r) => r.status === 200 });

  // 2. Simulate Login (Mock)
  const resLogin = http.post(`${BASE_URL}/api/login`, JSON.stringify({
    email: 'load_test@costloci.test',
    password: 'Password123!!'
  }), { headers: { 'Content-Type': 'application/json' } });
  
  check(resLogin, { 'login status is 200 or 401': (r) => r.status === 200 || r.status === 401 });

  // 3. View Dashboard
  if (resLogin.status === 200) {
    const resDash = http.get(`${BASE_URL}/api/dashboard/stats`);
    check(resDash, { 'dashboard status is 200': (r) => r.status === 200 });
  }

  sleep(1);
}
