# 🦞 HexClaw - Quickstart (VPS + PostgreSQL)

HexClaw läuft als Docker-Stack mit:
- `postgres` (PostgreSQL)
- `backend` (Node/Express)
- `frontend` (Nginx + Vite-Build)

## 1) VPS vorbereiten

```bash
# Beispiel: Ubuntu VPS
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

Repository klonen:

```bash
git clone <your-repo-url> hexclaw
cd hexclaw
```

## 2) Umgebung konfigurieren

```bash
cp .env.example .env
```

Mindestens setzen:
- `POSTGRES_PASSWORD`
- `OPENCLAW_BOT_SECRET`
- `SHARED_SECRET`
- `FRONTEND_URL` (z. B. `https://hexclaw.example.com`)

Optional:
- `GLM_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

## 3) Stack starten

```bash
docker compose up -d --build --remove-orphans
```

## 4) Healthchecks

```bash
# Backend
curl -i http://127.0.0.1:3001/health

# Frontend (wenn FRONTEND_PORT=80)
curl -i http://127.0.0.1/
```

## 5) Update-Deploy auf VPS

```bash
git fetch origin main
git checkout main
git pull --ff-only origin main
docker compose up -d --build --remove-orphans
```

## Optional: Lokale Entwicklung (ohne Docker)

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Hinweise

- HexClaw ist jetzt **100% free-to-play**.
- Es gibt **keine Wallet/Deposit/UDC-Mechanik** mehr.
- Gameplay basiert nur auf Territory + Score.
