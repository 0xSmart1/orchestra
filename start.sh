#!/usr/bin/env bash
# Orchestra — Quick Start Script
# Starts backend + frontend and opens the dashboard in your browser.

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "╔══════════════════════════════════════╗"
echo "║        Orchestra — Starting          ║"
echo "╚══════════════════════════════════════╝"

# Check .env
if [ ! -f "packages/backend/.env" ]; then
  echo "⚠  No packages/backend/.env found. Copying from .env.example..."
  cp packages/backend/.env.example packages/backend/.env
  echo "   Edit packages/backend/.env with your LLM API key before using chat/agents."
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Generate Prisma client if needed
if [ ! -d "packages/backend/node_modules/.prisma" ]; then
  echo "🗄️  Generating Prisma client..."
  cd packages/backend && npx prisma generate && cd "$ROOT_DIR"
fi

# Push DB schema if no DB file exists
if [ ! -f "packages/backend/prisma/orchestra.db" ]; then
  echo "🗄️  Initializing database..."
  cd packages/backend && npx prisma db push && cd "$ROOT_DIR"
fi

# Start backend in background
echo "🚀 Starting backend (port 3001)..."
cd packages/backend && npm run dev &
BACKEND_PID=$!
cd "$ROOT_DIR"

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
for i in $(seq 1 30); do
  if curl -s http://localhost:3001 > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Start frontend in background
echo "🚀 Starting frontend (port 3000)..."
cd packages/frontend && npm run dev &
FRONTEND_PID=$!
cd "$ROOT_DIR"

# Wait and open browser
echo "⏳ Waiting for frontend..."
for i in $(seq 1 30); do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Orchestra is running!              ║"
echo "║   Dashboard: http://localhost:3000    ║"
echo "║   Backend:   http://localhost:3001    ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Open browser
if command -v xdg-open &> /dev/null; then
  xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
  open http://localhost:3000
elif command -v start &> /dev/null; then
  start http://localhost:3000
fi

# Wait for either process to exit
wait
