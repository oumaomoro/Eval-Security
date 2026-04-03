@echo off
echo 🚀 Setting up CyberOptimize local development environment...

:: Check prerequisites
echo [INFO] Checking prerequisites...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org
    exit /b 1
)

:: Create project structure
echo [INFO] Creating project structure...
mkdir cyberoptimize-local
cd cyberoptimize-local
mkdir backend frontend scripts shared
mkdir backend\database backend\services backend\uploads
mkdir frontend\src frontend\src\components frontend\src\contexts

:: Create package.json files
echo [INFO] Creating package configuration...

:: Root package.json
echo {
echo   "name": "cyberoptimize-local",
echo   "version": "1.0.0",
echo   "scripts": {
echo     "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
echo     "dev:backend": "cd backend && npm run dev",
echo     "dev:frontend": "cd frontend && npm run dev",
echo     "start": "npm run dev",
echo     "setup": "scripts\\setup\\setup.bat"
echo   },
echo   "devDependencies": {
echo     "concurrently": "^8.2.0"
echo   }
echo } > package.json

:: Backend package.json
echo {
echo   "name": "cyberoptimize-backend",
echo   "version": "1.0.0",
echo   "type": "module",
echo   "scripts": {
echo     "dev": "node server.js",
echo     "start": "node server.js"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "cors": "^2.8.5",
echo     "sqlite3": "^5.1.6",
echo     "bcryptjs": "^2.4.3",
echo     "jsonwebtoken": "^9.0.2",
echo     "uuid": "^9.0.1"
echo   }
echo } > backend\package.json

:: Frontend package.json
echo {
echo   "name": "cyberoptimize-frontend",
echo   "private": true,
echo   "version": "1.0.0",
echo   "type": "module",
echo   "scripts": {
echo     "dev": "vite --host 0.0.0.0",
echo     "build": "vite build",
echo     "preview": "vite preview"
echo   },
echo   "dependencies": {
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "react-router-dom": "^6.20.1",
echo     "lucide-react": "^0.294.0"
echo   },
echo   "devDependencies": {
echo     "@vitejs/plugin-react": "^4.1.1",
echo     "tailwindcss": "^3.3.5",
echo     "vite": "^4.5.2"
echo   }
echo } > frontend\package.json

:: Install dependencies
echo [INFO] Installing dependencies...
call npm install
cd backend
call npm install
cd ..\frontend
call npm install
cd ..

echo [INFO] Setup complete!
echo [INFO] Start the application with: npm start
echo [INFO] Frontend: http://localhost:5173
echo [INFO] Backend: http://localhost:3001
echo [INFO] Test credentials: test@cyberoptimize.com / password123

pause
