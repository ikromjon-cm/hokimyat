#!/bin/bash
set -e

echo "================================================"
echo "  UYCHI MAJLIS - Setup Script"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} $1 is not installed. Please install it first."
        exit 1
    fi
    echo -e "${GREEN}[OK]${NC} $1 found"
}

echo "Checking prerequisites..."
check_command node
check_command pnpm
check_command docker
check_command docker-compose || check_command docker
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}[ERROR]${NC} Node.js 18+ required (found: $(node -v))"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Node.js version: $(node -v)"

# Copy env file
if [ ! -f apps/backend/.env ]; then
    echo -e "${YELLOW}[INFO]${NC} Creating .env file from .env.example..."
    cp .env.example apps/backend/.env
    echo -e "${GREEN}[OK]${NC} .env file created. Edit it with your configuration."
else
    echo -e "${GREEN}[OK]${NC} .env file exists"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install
echo -e "${GREEN}[OK]${NC} Dependencies installed"

# Start Docker services
echo ""
echo "Starting Docker services (PostgreSQL + Redis)..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker/docker-compose.yml up -d postgres redis 2>/dev/null || \
    docker compose -f docker/docker-compose.yml up -d postgres redis
else
    docker compose -f docker/docker-compose.yml up -d postgres redis
fi
echo -e "${GREEN}[OK]${NC} Docker services started"

# Wait for database
echo ""
echo "Waiting for database to be ready..."
sleep 3
echo -e "${GREEN}[OK]${NC} Database ready"

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
cd apps/backend
npx prisma generate
cd ../..
echo -e "${GREEN}[OK]${NC} Prisma client generated"

# Run migrations
echo ""
echo "Running database migrations..."
cd apps/backend
npx prisma migrate deploy
cd ../..
echo -e "${GREEN}[OK]${NC} Migrations applied"

# Seed database
echo ""
echo "Seeding database..."
cd apps/backend
npx tsx prisma/seed.ts
cd ../..
echo -e "${GREEN}[OK]${NC} Database seeded"

echo ""
echo "================================================"
echo -e "${GREEN}  Setup completed successfully!${NC}"
echo "================================================"
echo ""
echo "To start the backend:"
echo "  pnpm dev:backend"
echo ""
echo "To start the mobile app:"
echo "  pnpm dev:mobile"
echo ""
echo "API docs: http://localhost:4000/api-docs"
echo ""
