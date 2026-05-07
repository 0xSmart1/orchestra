@echo off
REM Orchestra — Quick Start (Windows)
REM Starts backend + frontend and opens the dashboard in your browser.

echo ========================================
echo        Orchestra — Starting
echo ========================================

cd /d "%~dp0"

REM Check .env
if not exist "packages\backend\.env" (
  echo [!] No packages\backend\.env found. Copying from .env.example...
  copy "packages\backend\.env.example" "packages\backend\.env"
  echo     Edit packages\backend\.env with your LLM API key before using chat/agents.
)

REM Install dependencies if needed
if not exist "node_modules" (
  echo [+] Installing dependencies...
  call npm install
)

REM Generate Prisma client if needed
if not exist "packages\backend\node_modules\.prisma" (
  echo [+] Generating Prisma client...
  cd packages\backend
  call npx prisma generate
  cd ..\..\
)

REM Push DB schema if no DB file exists
if not exist "packages\backend\prisma\orchestra.db" (
  echo [+] Initializing database...
  cd packages\backend
  call npx prisma db push
  cd ..\..\
)

REM Start backend
echo [+] Starting backend (port 3001)...
start "Orchestra Backend" cmd /c "cd /d %~dp0packages\backend && npm run dev"

REM Wait for backend
echo [+] Waiting for backend...
:wait_backend
timeout /t 1 /nobreak >nul
curl -s http://localhost:3001 >nul 2>&1
if errorlevel 1 goto wait_backend

REM Start frontend
echo [+] Starting frontend (port 3000)...
start "Orchestra Frontend" cmd /c "cd /d %~dp0packages\frontend && npm run dev"

REM Wait and open browser
echo [+] Waiting for frontend...
:wait_frontend
timeout /t 1 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 goto wait_frontend

echo.
echo ========================================
echo   Orchestra is running!
echo   Dashboard: http://localhost:3000
echo   Backend:   http://localhost:3001
echo ========================================
echo.

start http://localhost:3000
