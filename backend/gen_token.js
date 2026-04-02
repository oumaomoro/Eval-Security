import jwt from 'jsonwebtoken';
const JWT_SECRET = 'costloci-secret-2026';
const userId = '43a389be-72c7-4604-9e1a-1033eeac25ca5';

const token = jwt.sign(
    { id: userId, email: 'test@example.com', role: 'admin', tier: 'enterprise' },
    JWT_SECRET,
    { expiresIn: '7d' }
);

console.log('TOKEN:', token);
