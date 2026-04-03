#!/bin/bash

# CyberOptimize Local Development Auto-Setup
echo "🚀 Setting up CyberOptimize local development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION=18
    if [ $(echo "$NODE_VERSION < $REQUIRED_VERSION" | bc) -eq 1 ]; then
        print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18+"
        exit 1
    fi
    
    # Check if Docker is installed (optional)
    if command -v docker &> /dev/null; then
        DOCKER_AVAILABLE=true
    else
        DOCKER_AVAILABLE=false
        print_warning "Docker not found. Using SQLite instead of PostgreSQL."
    fi
    
    print_status "Prerequisites check passed!"
}

# Create project structure
create_project_structure() {
    print_status "Creating project structure..."
    
    mkdir -p cyberoptimize-local/{backend,frontend,scripts,shared}
    mkdir -p backend/{database,services,uploads}
    mkdir -p frontend/src/{components,contexts,pages,utils}
    mkdir -p scripts/{setup,deploy,test}
    
    cd cyberoptimize-local
}

# Create package.json files
create_package_files() {
    print_status "Creating package configuration..."
    
    # Root package.json
    cat > package.json << 'EOF'
{
  "name": "cyberoptimize-local",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "setup": "./scripts/setup/setup.sh",
    "start": "npm run dev",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "reset": "./scripts/setup/reset.sh",
    "docker:dev": "docker-compose -f docker-compose.dev.yml up -d",
    "docker:down": "docker-compose -f docker-compose.dev.yml down"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
EOF

    # Backend package.json
    cat > backend/package.json << 'EOF'
{
  "name": "cyberoptimize-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js",
    "build": "echo 'Backend built successfully'",
    "test": "node --test test/*.test.js",
    "test:watch": "node --test --watch test/*.test.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "sqlite3": "^5.1.6",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

    # Frontend package.json
    cat > frontend/package.json << 'EOF'
{
  "name": "cyberoptimize-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "test": "echo 'Frontend tests would run here'",
    "test:watch": "echo 'Frontend test watch mode'"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.1.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "vite": "^4.5.2"
  }
}
EOF
}

# Create configuration files
create_config_files() {
    print_status "Creating configuration files..."
    
    # Backend server.js
    cat > backend/server.js << 'EOF'
import express from 'express';
import cors from 'cors';
import { Database } from './database/database.js';
import { AuthService } from './services/auth.js';
import { ContractService } from './services/contracts.js';
import { AIService } from './services/ai.js';
import { UpsellEngine } from './services/upsell.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('uploads'));

// Initialize services
const db = new Database();
const authService = new AuthService(db);
const contractService = new ContractService(db);
const aiService = new AIService();
const upsellEngine = new UpsellEngine(db);

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const user = authService.verifyToken(token);
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.register(email, password);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

app.get('/api/contracts', authenticateToken, async (req, res) => {
    try {
        const contracts = await contractService.getUserContracts(req.user.id);
        res.json({ success: true, data: contracts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/contracts/analyze', authenticateToken, async (req, res) => {
    try {
        const { fileData, fileName, clientId } = req.body;
        
        const result = await contractService.analyzeContract({
            fileData, fileName, clientId, userId: req.user.id
        });
        
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/upsell/recommendations', authenticateToken, async (req, res) => {
    try {
        const recommendations = await upsellEngine.getRecommendations(req.user.id);
        res.json({ success: true, data: recommendations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/dashboard/metrics', authenticateToken, async (req, res) => {
    try {
        const metrics = await contractService.getDashboardMetrics(req.user.id);
        res.json({ success: true, data: metrics });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'development'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 CyberOptimize backend running on http://localhost:${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
});

export default app;
EOF

    # Frontend vite.config.js
    cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
EOF

    # Frontend index.html
    cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CyberOptimize - Local</title>
    <style>
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF
}

# Create all source code files
create_source_files() {
    print_status "Generating source code files..."
    
    # Create backend services (simplified versions)
    mkdir -p backend/database
    mkdir -p backend/services
    
    # Database service
    cat > backend/database/database.js << 'EOF'
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

export class Database {
    constructor() {
        this.init();
    }

    async init() {
        this.db = await open({
            filename: './database/cyberoptimize.db',
            driver: sqlite3.Database
        });
        await this.createTables();
        await this.seedData();
    }

    async createTables() {
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                tier TEXT DEFAULT 'free',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS clients (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                company_name TEXT NOT NULL,
                industry TEXT,
                annual_budget REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS contracts (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                client_id TEXT NOT NULL,
                vendor_name TEXT NOT NULL,
                product_service TEXT,
                annual_cost REAL,
                contract_start_date TEXT,
                renewal_date TEXT,
                contract_term_months INTEGER,
                license_count INTEGER,
                auto_renewal BOOLEAN DEFAULT 0,
                payment_frequency TEXT,
                file_name TEXT,
                ai_analysis TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    async seedData() {
        const userCount = await this.db.get('SELECT COUNT(*) as count FROM users');
        if (userCount.count === 0) {
            const hashedPassword = await bcrypt.hash('password123', 12);
            await this.db.run(
                'INSERT INTO users (id, email, password_hash, tier) VALUES (?, ?, ?, ?)',
                ['test-user-123', 'test@cyberoptimize.com', hashedPassword, 'professional']
            );
            console.log('✅ Sample data seeded');
        }
    }
}
EOF

    # Auth service
    cat > backend/services/auth.js << 'EOF'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = 'cyberoptimize-local-secret-2024';

export class AuthService {
    constructor(db) {
        this.db = db;
    }

    async register(email, password) {
        const existingUser = await this.db.db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) throw new Error('User already exists');

        const passwordHash = await bcrypt.hash(password, 12);
        const userId = uuidv4();

        await this.db.db.run('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [userId, email, passwordHash]);

        const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
        return { user: { id: userId, email, tier: 'free' }, token };
    }

    async login(email, password) {
        const user = await this.db.db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) throw new Error('Invalid credentials');

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) throw new Error('Invalid credentials');

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        return { user: { id: user.id, email: user.email, tier: user.tier }, token };
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}
EOF

    # Create frontend source files
    cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

    cat > frontend/src/App.jsx << 'EOF'
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Contracts from './components/Contracts'
import Upload from './components/Upload'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/contracts" element={user ? <Layout><Contracts /></Layout> : <Navigate to="/login" />} />
        <Route path="/upload" element={user ? <Layout><Upload /></Layout> : <Navigate to="/login" />} />
      </Routes>
    </div>
  )
}

export default App
EOF

    # Continue creating all other source files...
    # [Additional file creation code would go here]
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install backend dependencies
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies
    cd frontend
    npm install
    cd ..
}

# Start the application
start_application() {
    print_status "Starting CyberOptimize..."
    print_status "Frontend will be available at: http://localhost:5173"
    print_status "Backend API will be available at: http://localhost:3001"
    print_status "Test credentials: test@cyberoptimize.com / password123"
    
    # Start both frontend and backend
    npm run dev
}

# Main execution
main() {
    print_status "Starting CyberOptimize automated setup..."
    
    check_prerequisites
    create_project_structure
    create_package_files
    create_config_files
    create_source_files
    install_dependencies
    start_application
}

# Run the main function
main "$@"
