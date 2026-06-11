#!/bin/bash

# Exit immediately if any command fails
set -e

# Define color outputs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Maths Tutor AI Startup Script ===${NC}"

# 1. Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}node_modules not found. Installing dependencies...${NC}"
  npm install
else
  echo -e "${GREEN}✓ Dependencies installed.${NC}"
fi

# 2. Set up database if maths_tutor.db doesn't exist
if [ ! -f "maths_tutor.db" ]; then
  echo -e "${YELLOW}Database not found. Initializing SQLite database...${NC}"
  npx prisma db push
  echo -e "${GREEN}✓ Database initialized and seeded.${NC}"
else
  echo -e "${GREEN}✓ Database file detected.${NC}"
fi

# 3. Check for flags
DEV_MODE=false
for arg in "$@"; do
  if [ "$arg" == "--dev" ] || [ "$arg" == "-d" ]; then
    DEV_MODE=true
  fi
done

if [ "$DEV_MODE" = true ]; then
  echo -e "${BLUE}Starting Maths Tutor in DEVELOPMENT mode...${NC}"
  npm run dev
else
  echo -e "${BLUE}Starting Maths Tutor in PRODUCTION mode...${NC}"
  # Run a build if .next directory is missing
  if [ ! -d ".next" ]; then
    echo -e "${YELLOW}.next build folder not found. Building the site...${NC}"
    npm run build
  fi
  npm run start
fi
