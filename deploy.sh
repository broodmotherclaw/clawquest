#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "🚀 ClawQuest VPS Deployment"
echo "============================"

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ docker is not installed"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "❌ docker compose is not available"
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "❌ Missing .env in $ROOT_DIR"
  echo "   cp .env.example .env"
  echo "   then set secure production values"
  exit 1
fi

echo "📦 Building and starting containers..."
docker compose up -d --build --remove-orphans

echo "⏳ Waiting for backend health check..."
for i in $(seq 1 30); do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health || true)
  if [ "$status" = "200" ]; then
    echo "✅ Backend is healthy"
    break
  fi

  if [ "$i" = "30" ]; then
    echo "❌ Backend health check failed"
    docker compose logs --tail=150 backend || true
    exit 1
  fi

  sleep 2
done

frontend_port="${FRONTEND_PORT:-80}"
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${frontend_port}/" || true)
if [ "$frontend_status" = "200" ] || [ "$frontend_status" = "304" ]; then
  echo "✅ Frontend reachable on port ${frontend_port}"
else
  echo "⚠️  Frontend returned HTTP ${frontend_status} on port ${frontend_port}"
fi

echo ""
echo "✅ Deployment finished"
echo "   Frontend: http://<your-vps-ip>:${frontend_port}"
echo "   Backend health: http://<your-vps-ip>:3001/health"

docker compose ps
