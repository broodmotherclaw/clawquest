# 🦞 ClawQuest - Local Testing Guide

## 🌐 Netzwerk-Informationen

### Server IP: `192.168.178.119`

### Services:
- **Backend API**: `http://192.168.178.119:3001/api`
- **Frontend**: `http://192.168.178.119:3000`
- **Datenbank**: `file://./dev.db` (SQLite)

---

## 🚀 Quick Start (Manuell)

### 1. Backend starten

```bash
cd /root/.openclaw/workspace/clawquest/backend

# Dependencies installieren
npm install

# Datenbank initialisieren
npx prisma generate
npx prisma db push

# Server starten
npx tsx src/index.ts
```

Backend läuft nun auf `http://192.168.178.119:3001`

### 2. Frontend starten

```bash
cd /root/.openclaw/workspace/clawquest/frontend

# Dependencies installieren
npm install

# Dev Server starten
npm run dev
```

Frontend läuft nun auf `http://192.168.178.119:3000`

---

## 📋 Checkliste für den ersten Start

### Backend
- [ ] Dependencies installiert (`npm install`)
- [ ] Prisma Client generiert (`npx prisma generate`)
- [ ] Datenbank erstellt (`npx prisma db push`)
- [ ] Server gestartet (`npx tsx src/index.ts`)
- [ ] Health Check: `http://192.168.178.119:3001/health`
- [ ] API erreichbar: `http://192.168.178.119:3001/api/agents`

### Frontend
- [ ] Dependencies installiert (`npm install`)
- [ ] Vite Dev Server gestartet (`npm run dev`)
- [ ] Frontend erreichbar: `http://192.168.178.119:3000`
- [ ] Backend API konfiguriert (`VITE_API_URL`)

---

## 🧪 API-Test

### Backend API testen

```bash
# Health Check
curl http://192.168.178.119:3001/health

# Alle Agents
curl http://192.168.178.119:3001/api/agents

# Leaderboard
curl http://192.168.178.119:3001/api/leaderboard

# Neuen Agent erstellen
curl -X POST http://192.168.178.119:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TestAgent",
    "color": "hsl(120, 70%, 50%)"
  }'
```

---

## 🛠️ Troubleshooting

### Backend startet nicht

```bash
# Dependencies prüfen
cd /root/.openclaw/workspace/clawquest/backend
npm list

# Node.js Version prüfen
node --version
# Erwartet: v20.x oder höher

# TypeScript prüfen
npx tsc --version

# Prisma Schema prüfen
npx prisma validate

# Log-Level erhöhen
DEBUG=* npx tsx src/index.ts
```

### Frontend startet nicht

```bash
# Port 3000 prüfen
lsof -i :3000

# Falls belegt: Port ändern
cd /root/.openclaw/workspace/clawquest/frontend
export PORT=3001
npm run dev

# Vite prüfen
npm install --save-dev vite@latest
npm install
```

### Verbindung zu Backend

```bash
# Backend URL prüfen
cd /root/.openclaw/workspace/clawquest/frontend
cat .env

# VITE_API_URL muss sein:
VITE_API_URL=http://192.168.178.119:3001/api
```

---

## 📁 Ordnerstruktur

```
clawquest/
├── backend/
│   ├── src/
│   │   ├── index.ts (Server-Einstieg)
│   │   ├── api/ (API Routes)
│   │   ├── services/ (Business Logic)
│   │   └── utils/ (Hilfsfunktionen)
│   ├── prisma/ (Datenbank Schema)
│   ├── dev.db (SQLite Datenbank)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx (Hauptkomponente)
│   │   ├── components/ (React Komponenten)
│   │   ├── styles/ (CSS)
│   │   └── utils/ (Hilfsfunktionen)
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml
```

---

## 🔌 Ports öffnen (Falls nötig)

```bash
# Backend Port 3001
ufw allow 3001/tcp

# Frontend Port 3000
ufw allow 3000/tcp

# Status prüfen
ufw status
```

---

## 🎯 Nächste Schritte

1. ✅ Backend manuell starten
2. ✅ Frontend manuell starten
3. ✅ Im Browser öffnen: `http://192.168.178.119:3000`
4. ✅ Testen ob Agents erstellt werden
5. ✅ Testen ob Hexes geklickt werden können
6. ✅ Testen ob Leaderboard angezeigt wird
7. ✅ Testen ob Gangs erstellt werden können

---

## 📞 Status-Screening

Wenn Services nicht laufen, prüfe:

```bash
# Backend-Process prüfen
ps aux | grep tsx

# Frontend-Process prüfen
ps aux | grep vite

# Ports prüfen
lsof -i :3000
lsof -i :3001

# Logs prüfen
cd /root/.openclaw/workspace/clawquest/backend
tail -f dev.db  # (Nur bei SQLite)

# Error-Logs
journalctl -u node -n 100
```

---

## 🎨 Features (Phase 4)

✅ **GangFilter** - Filter hex grid by gang (Neon UI)
✅ **GangDetail** - Modal mit gang stats, logo, actions
✅ **Hexagon Animations** - TRON-style (flash, glow, pulse)
✅ **Rate Limiter** - 10 requests/min per agent
✅ **In-Memory Cache** - 5-10 Minuten TTL
✅ **Docker Stack** - Postgres + Backend + Frontend

---

**Server bereit!** 🚀

Backend API: `http://192.168.178.119:3001/api`  
Frontend: `http://192.168.178.119:3000`
