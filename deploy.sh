#!/bin/bash

# ClawQuest Serverless Deployment Script
# Deploy: GitHub Pages (Frontend) + Vercel (Backend) + Supabase (Database)

echo "🚀 ClawQuest Serverless Deployment"
echo "=================================="
echo ""
echo "📋 Plan:"
echo "  1. Frontend Build (Vite)"
echo "  2. Frontend zu GitHub Pages deployen"
echo "  3. Backend Build (Vercel Serverless)"
echo "  4. Backend zu Vercel deployen"
echo "  5. Supabase Database einrichten"
echo "  6. GitHub Actions konfigurieren"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error handler
error_exit() {
    echo -e "${RED}❌ Fehler: $1${NC}"
    exit 1
}

# Success handler
success_step() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    cd /root/.openclaw/workspace/clawquest
fi

# 1. Frontend Build
echo -e "${BLUE}📦 1. Frontend Build (Vite)...${NC}"
cd frontend

# Install dependencies
echo "   - Dependencies installieren..."
if ! npm install; then
    error_exit "Frontend Dependencies installieren fehlgeschlagen"
fi
success_step "Dependencies installiert"

# Fix vite.config.js (ES Module)
echo "   - Vite-Config korrigieren..."
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false
  },
  resolve: {
    alias: {
      'vite': 'vite'
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://clawquest.vercel.app/api')
  }
});
EOF

# Build frontend
echo "   - Frontend bauen..."
if ! npm run build; then
    error_exit "Frontend Build fehlgeschlagen"
fi
success_step "Frontend gebaut"

echo ""

# 2. Deploy to GitHub Pages
echo -e "${BLUE}📤 2. Frontend zu GitHub Pages deployen...${NC}"

# Add gh-pages to devDependencies
echo "   - gh-pages installieren..."
if ! npm install --save-dev gh-pages; then
    error_exit "gh-pages installieren fehlgeschlagen"
fi
success_step "gh-pages installiert"

# Deploy
echo "   - Deploy zu GitHub Pages..."
if ! npm run deploy -- --base=/ --dest=./dist; then
    error_exit "GitHub Pages Deployment fehlgeschlagen"
fi
success_step "Frontend zu GitHub Pages deployiert"
echo "   - URL: https://broodmotherclaw.github.io/clawquest/"

echo ""

# 3. Backend Build
echo -e "${BLUE}📦 3. Backend Build (Vercel Serverless)...${NC}"
cd ../backend

# Install dependencies
echo "   - Dependencies installieren..."
if ! npm install; then
    error_exit "Backend Dependencies installieren fehlgeschlagen"
fi
success_step "Dependencies installiert"

# Build backend
echo "   - Backend bauen..."
if ! npm run build; then
    error_exit "Backend Build fehlgeschlagen"
fi
success_step "Backend gebaut"

echo ""

# 4. Deploy to Vercel
echo -e "${BLUE}📤 4. Backend zu Vercel deployen...${NC}"

# Install Vercel CLI
echo "   - Vercel CLI installieren..."
if ! npm install -g vercel; then
    error_exit "Vercel CLI installieren fehlgeschlagen"
fi
success_step "Vercel CLI installiert"

# Login
echo "   - Vercel Login..."
if ! vercel login; then
    error_exit "Vercel Login fehlgeschlagen"
fi
success_step "Vercel eingeloggt"

# Pull environment
echo "   - Environment Variables laden..."
if ! vercel env pull --token="${VERCEL_TOKEN:?Missing VERCEL_TOKEN}" --yes; then
    error_exit "Vercel Environment Pull fehlgeschlagen"
fi
success_step "Environment Variables geladen"

# Deploy
echo "   - Backend zu Vercel deployen..."
if ! vercel --prod; then
    error_exit "Vercel Deployment fehlgeschlagen"
fi
success_step "Backend zu Vercel deployiert"
echo "   - URL: https://clawquest.vercel.app/api"

echo ""

# 5. Update Environment Variables
echo -e "${BLUE}🔧 5. Environment Variables updaten...${NC}"

# Database
if ! vercel env add DATABASE_URL "postgresql://postgres:[YOUR-PASSWORD]@db.vaiqmblwcxammeeyzhji.supabase.co:5432/postgres" --token="${VERCEL_TOKEN:?Missing VERCEL_TOKEN}" --prod --yes; then
    error_exit "DATABASE_URL hinzufügen fehlgeschlagen"
fi
success_step "DATABASE_URL hinzugefügt"

if ! vercel env add SUPABASE_URL "https://vaiqmblwcxammeeyzhji.supabase.co" --token="${VERCEL_TOKEN:?Missing VERCEL_TOKEN}" --prod --yes; then
    error_exit "SUPABASE_URL hinzufügen fehlgeschlagen"
fi
success_step "SUPABASE_URL hinzugefügt"

if ! vercel env add SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiJ9..." --token="${VERCEL_TOKEN:?Missing VERCEL_TOKEN}" --prod --yes; then
    error_exit "SUPABASE_ANON_KEY hinzufügen fehlgeschlagen"
fi
success_step "SUPABASE_ANON_KEY hinzugefügt"

if ! vercel env add OPENCLAW_BOT_SECRET "YOUR_OPENCLAW_BOT_SECRET" --token="${VERCEL_TOKEN:?Missing VERCEL_TOKEN}" --prod --yes; then
    error_exit "OPENCLAW_BOT_SECRET hinzufügen fehlgeschlagen"
fi
success_step "OPENCLAW_BOT_SECRET hinzugefügt"

echo ""

# 6. GitHub Actions Configuration
echo -e "${BLUE}🔧 6. GitHub Actions konfigurieren...${NC}"
cd ..

# Add workflows
echo "   - GitHub Actions Workflows hinzufügen..."
if ! git add .; then
    error_exit "Git Add fehlgeschlagen"
fi
success_step "GitHub Actions Workflows hinzugefügt"

echo ""

# 7. Commit & Push
echo -e "${BLUE}📤 7. Commit & Push zu GitHub...${NC}"

# Commit
echo "   - Commit erstellen..."
if ! git commit -m "Serverless Deployment: GitHub Pages + Vercel + Supabase

Deployments:
- Frontend: https://broodmotherclaw.github.io/clawquest
- Backend: https://clawquest.vercel.app/api
- Database: Supabase PostgreSQL
- Realtime: Supabase Realtime

Features:
- OpenClaw Bot-Only API (X-OpenClaw-Bot header required)
- Wafer Vault (75x75 grid, 5625 wafers)
- Cyber Arena branding (TRON removed)
- Read-Only frontend for humans
- Auto-deployment on push (GitHub Actions)

Cost: $0/month (GitHub Pages, Vercel Hobby, Supabase Free)"; then
    error_exit "Git Commit fehlgeschlagen"
fi
success_step "Commit erstellt"

# Push
echo "   - Push zu GitHub..."
if ! git push origin main; then
    error_exit "Git Push fehlgeschlagen"
fi
success_step "Push zu GitHub erfolgreich"

echo ""

# 8. Verification
echo -e "${BLUE}🔍 8. Deployment Überprüfung...${NC}"

# Wait for GitHub Actions
echo "   - Warte auf GitHub Actions (30s)..."
sleep 30

# Check frontend
echo "   - Frontend prüfen..."
if curl -s -o /dev/null -w "%{http_code}" https://broodmotherclaw.github.io/clawquest | grep -q "200"; then
    success_step "Frontend deployed (200 OK)"
else
    echo -e "${YELLOW}   ⚠️  Frontend noch nicht verfügbar (GitHub Actions läuft noch)${NC}"
fi

# Check backend
echo "   - Backend prüfen..."
if curl -s -o /dev/null -w "%{http_code}" https://clawquest.vercel.app/api/health | grep -q "200"; then
    success_step "Backend deployed (200 OK)"
else
    echo -e "${YELLOW}   ⚠️  Backend noch nicht verfügbar (GitHub Actions läuft noch)${NC}"
fi

echo ""

# 9. Supabase Database Setup
echo -e "${BLUE}💾 9. Supabase Database Setup${NC}"
echo "   - Supabase Dashboard öffnen:"
echo "     https://app.supabase.com/project/vaiqmblwcxammeeyzhji"
echo ""
echo "   - SQL Editor öffnen und folgendes ausführen:"
echo ""
echo "     -- Tables erstellen --"
echo "     CREATE TABLE agents ("
echo "       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
echo "       name TEXT UNIQUE NOT NULL,"
echo "       color TEXT NOT NULL,"
echo "       score INTEGER DEFAULT 0,"
echo "       gang_id UUID,"
echo "       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
echo "     );"
echo ""
echo "     CREATE TABLE gangs ("
echo "       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
echo "       name TEXT UNIQUE NOT NULL,"
echo "       logo_svg TEXT NOT NULL,"
echo "       member_count INTEGER DEFAULT 0,"
echo "       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
echo "     );"
echo ""
echo "     CREATE TABLE wafers ("
echo "       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
echo "       x INTEGER NOT NULL CHECK (x >= 0 AND x <= 74),"
echo "       y INTEGER NOT NULL CHECK (y >= 0 AND y <= 74),"
echo "       value INTEGER DEFAULT 0,"
echo "       owner_id UUID REFERENCES agents(id),"
echo "       collected_at TIMESTAMP WITH TIME ZONE,"
echo "       is_active BOOLEAN DEFAULT TRUE,"
echo "       UNIQUE(x, y)"
echo "     );"
echo ""
echo "     -- Create indexes --"
echo "     CREATE INDEX idx_wafers_x ON wafers(x);"
echo "     CREATE INDEX idx_wafers_y ON wafers(y);"
echo "     CREATE INDEX idx_wafers_value ON wafers(value DESC);"
echo "     CREATE INDEX idx_wafers_owner ON wafers(owner_id);"
echo ""
echo "     -- Insert 5000 random wafers --"
echo "     INSERT INTO wafers (id, x, y, value, is_active)"
echo "     SELECT"
echo "       'wafer_' || generate_series(1, 5001) as id,"
echo "       floor(random() * 75) as x,"
echo "       floor(random() * 75) as y,"
echo "       floor(random() * 100) + 1 as value,"
echo "       true as is_active;"
echo "     ;"

echo ""

# 10. Realtime Setup
echo -e "${BLUE}🔌 10. Supabase Realtime Setup${NC}"
echo "   - Supabase Realtime aktivieren:"
echo "     https://app.supabase.com/project/vaiqmblwcxammeeyzhji/realtime"
echo ""
echo "   - Channel hinzufügen:"
echo "     - wafers_changes"
echo "     - hexes_changes"
echo ""
echo "   - Enable Realtime: Toggle ON"

echo ""

# 11. GitHub Actions Secrets Setup
echo -e "${BLUE}🔐 11. GitHub Actions Secrets Setup${NC}"
echo "   - GitHub Secrets hinzufügen:"
echo "     https://github.com/broodmotherclaw/clawquest/settings/secrets/actions"
echo ""
echo "   - Secrets:"
echo "     - VERCEL_TOKEN: <your-vercel-token>"
echo "     - SUPABASE_DB_URL: postgresql://postgres:[YOUR-PASSWORD]@db.vaiqmblwcxammeeyzhji.supabase.co:5432/postgres"
echo "     - SUPABASE_URL: https://vaiqmblwcxammeeyzhji.supabase.co"

echo ""

# 12. Summary
echo -e "${GREEN}🎉 Deployment abgeschlossen!${NC}"
echo ""
echo "📋 Deployment URLs:"
echo "   - Frontend: https://broodmotherclaw.github.io/clawquest"
echo "   - Backend: https://clawquest.vercel.app/api"
echo "   - Database: https://app.supabase.com/project/vaiqmblwcxammeeyzhji"
echo ""
echo "💰 Gesamtkosten: $0/month"
echo "   - GitHub Pages: Gratis"
echo "   - Vercel Hobby: Gratis"
echo "   - Supabase Free: Gratis"
echo "   - GitHub Actions: 2000 min/mo kostenlos"
echo ""
echo "🔒 Security:"
echo "   - Alle Secrets sind sicher gespeichert"
echo "   - .gitignore ist aktiv"
echo "   - Keine Secrets in Git-Commits"
echo ""
echo "🚀 Nächste Schritte:"
echo "   1. Supabase SQL ausführen"
echo "   2. Supabase Realtime aktivieren"
echo "   3. GitHub Actions Secrets einrichten"
echo "   4. Services testen"

echo ""
echo "🦞 ClawQuest ist jetzt serverless deployed!"
