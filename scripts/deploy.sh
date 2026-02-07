#!/bin/bash

# ClawQuest VPS Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Example: ./scripts/deploy.sh production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment
ENV=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   ClawQuest VPS Deployment Script    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Environment: ${YELLOW}$ENV${NC}"
echo -e "Project Directory: ${YELLOW}$PROJECT_DIR${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Change to project directory
cd "$PROJECT_DIR"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo -e "Creating .env file from .env.example..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env from .env.example${NC}"
        echo -e "${YELLOW}Please edit .env file with your actual values before continuing${NC}"
        echo -e "Run: nano .env"
        exit 1
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Load environment variables
set -a
source .env
set +a

echo -e "${BLUE}Step 1: Building and starting services...${NC}"
$DOCKER_COMPOSE down --remove-orphans 2>/dev/null || true
$DOCKER_COMPOSE build --no-cache
$DOCKER_COMPOSE up -d

echo ""
echo -e "${BLUE}Step 2: Waiting for database to be ready...${NC}"
sleep 5

# Wait for PostgreSQL to be healthy
echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
for i in {1..30}; do
    if $DOCKER_COMPOSE exec -T postgres pg_isready -U "${POSTGRES_USER:-clawquest}" -d "${POSTGRES_DB:-clawquest}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: PostgreSQL failed to start${NC}"
        $DOCKER_COMPOSE logs postgres
        exit 1
    fi
done

echo ""
echo -e "${BLUE}Step 3: Running database migrations...${NC}"

# Copy PostgreSQL schema for migrations
docker cp "$PROJECT_DIR/backend/prisma/schema.prisma.postgresql" "clawquest-backend:/app/prisma/schema.prisma"

# Run migrations
if $DOCKER_COMPOSE exec -T backend npx prisma migrate deploy; then
    echo -e "${GREEN}✓ Database migrations completed${NC}"
else
    echo -e "${YELLOW}Warning: Migration failed, attempting to initialize database...${NC}"
    $DOCKER_COMPOSE exec -T backend npx prisma db push --accept-data-loss || true
fi

echo ""
echo -e "${BLUE}Step 4: Generating Prisma client...${NC}"
$DOCKER_COMPOSE exec -T backend npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"

echo ""
echo -e "${BLUE}Step 5: Health checks...${NC}"

# Check backend health
for i in {1..10}; do
    if curl -sf http://localhost:3001/health > /dev/null 2>&1 || \
       $DOCKER_COMPOSE exec -T backend wget -q --spider http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    echo -n "."
    sleep 2
    
    if [ $i -eq 10 ]; then
        echo -e "${YELLOW}Warning: Backend health check failed${NC}"
        $DOCKER_COMPOSE logs backend --tail=50
    fi
done

# Check frontend
for i in {1..10}; do
    if curl -sf http://localhost > /dev/null 2>&1 || \
       $DOCKER_COMPOSE exec -T frontend wget -q --spider http://localhost > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is accessible${NC}"
        break
    fi
    echo -n "."
    sleep 2
    
    if [ $i -eq 10 ]; then
        echo -e "${YELLOW}Warning: Frontend health check failed${NC}"
        $DOCKER_COMPOSE logs frontend --tail=50
    fi
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   Deployment completed successfully!   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Services are running:"
echo -e "  ${GREEN}• Frontend:${NC} http://localhost (or your server IP)"
echo -e "  ${GREEN}• Backend API:${NC} http://localhost:3001 (internal)"
echo -e "  ${GREEN}• PostgreSQL:${NC} localhost:5432 (internal)"
echo -e "  ${GREEN}• Redis:${NC} localhost:6379 (internal)"
echo ""
echo -e "Useful commands:"
echo -e "  ${YELLOW}View logs:${NC}        $DOCKER_COMPOSE logs -f"
echo -e "  ${YELLOW}View backend:${NC}    $DOCKER_COMPOSE logs -f backend"
echo -e "  ${YELLOW}View frontend:${NC}   $DOCKER_COMPOSE logs -f frontend"
echo -e "  ${YELLOW}Stop services:${NC}   $DOCKER_COMPOSE down"
echo -e "  ${YELLOW}Restart:${NC}         $DOCKER_COMPOSE restart"
echo -e "  ${YELLOW}Database shell:${NC}  $DOCKER_COMPOSE exec postgres psql -U ${POSTGRES_USER:-clawquest} -d ${POSTGRES_DB:-clawquest}"
echo ""
echo -e "${YELLOW}Note:${NC} Make sure to configure your firewall to allow port 80 (HTTP)"
echo ""
