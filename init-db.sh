#!/bin/bash

# Exit immediately if any command fails
set -e

# Define color outputs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}=== Database Reset / Truncate ===${NC}"
echo -e "${YELLOW}Warning: This will delete the SQLite database and reseet it to the baseline seed.${NC}"

# Ask for confirmation unless a non-interactive flag is passed
CONFIRM="y"
if [ "$1" != "-y" ]; then
  read -p "Are you sure you want to proceed? (y/N): " CONFIRM
fi

if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}Resetting database...${NC}"
  
  # Remove SQLite database file and associated WAL/journal files
  rm -f data/maths_tutor.db data/maths_tutor.db-journal data/maths_tutor.db-shm data/maths_tutor.db-wal
  
  # Re-push schema to create a clean database structure
  npx prisma db push
  
  # Run the database seeding
  npx prisma db seed
  
  echo -e "${GREEN}✓ Database successfully truncated, recreated, and seeded!${NC}"
else
  echo -e "${BLUE}Reset aborted.${NC}"
fi
