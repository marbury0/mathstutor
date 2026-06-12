#!/usr/bin/env bash

# Exit immediately if a command fails
set -e

# Configuration
DB_FILE="maths_tutor.db"
BACKUP_DIR="backups"
MAX_BACKUPS=3

# Color outputs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

mkdir -p "$BACKUP_DIR"

function show_help() {
  echo -e "Maths Tutor Database Backup & Disaster Recovery tool"
  echo -e "Usage:"
  echo -e "  $0 backup          - Create a timestamped backup of the current database"
  echo -e "  $0 list            - List all available backups"
  echo -e "  $0 restore <file>  - Restore database from a specific backup file"
  echo -e "  $0 prune           - Remove backups exceeding the limit (keeps latest $MAX_BACKUPS)"
}

function backup_db() {
  if [ ! -f "$DB_FILE" ]; then
    echo -e "${RED}Error: Database file '$DB_FILE' does not exist!${NC}"
    exit 1
  fi

  TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
  BACKUP_FILE="$BACKUP_DIR/maths_tutor_backup_$TIMESTAMP.db"

  echo -e "${BLUE}Backing up database...${NC}"

  # Try to use sqlite3 CLI for a safe online backup to handle locks properly
  if command -v sqlite3 &> /dev/null; then
    sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
  else
    echo -e "${YELLOW}Warning: sqlite3 CLI not found. Falling back to file copy.${NC}"
    cp "$DB_FILE" "$BACKUP_FILE"
  fi

  echo -e "${GREEN}✓ Backup created successfully: $BACKUP_FILE${NC}"
  prune_backups
}

function list_backups() {
  echo -e "${BLUE}Available backups in '$BACKUP_DIR/':${NC}"
  if [ -z "$(ls -A "$BACKUP_DIR")" ]; then
    echo -e "  No backups found."
    return
  fi
  ls -lh "$BACKUP_DIR"/*.db 2>/dev/null || echo -e "  No backups found."
}

function restore_db() {
  local file="$1"

  if [ -z "$file" ]; then
    echo -e "${RED}Error: Please specify a backup file to restore.${NC}"
    echo -e "Example: $0 restore backups/maths_tutor_backup_2026-06-12_15-00-00.db"
    exit 1
  fi

  if [ ! -f "$file" ]; then
    echo -e "${RED}Error: Backup file '$file' not found!${NC}"
    exit 1
  fi

  echo -e "${RED}=== WARNING: RESTORE DATABASE ===${NC}"
  echo -e "${YELLOW}This will overwrite your current database and all active sessions/progress.${NC}"
  read -p "Are you sure you want to restore from '$file'? (y/N): " confirm

  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Restoring from $file...${NC}"
    
    # 1. Create a quick pre-restore backup of the current database just in case
    if [ -f "$DB_FILE" ]; then
      cp "$DB_FILE" "${DB_FILE}.pre-restore.bak"
      echo -e "${YELLOW}Saved current database copy to ${DB_FILE}.pre-restore.bak${NC}"
    fi

    # 2. Delete WAL/journal files to avoid locking conflicts with the restored base file
    rm -f maths_tutor.db-journal maths_tutor.db-shm maths_tutor.db-wal

    # 3. Copy the backup file to active db
    cp "$file" "$DB_FILE"

    echo -e "${GREEN}✓ Database successfully restored from $file!${NC}"
  else
    echo -e "${BLUE}Restoration aborted.${NC}"
  fi
}

function prune_backups() {
  echo -e "${BLUE}Pruning old backups...${NC}"
  
  # List backups sorted by modification time (oldest first)
  # and delete any exceeding MAX_BACKUPS limit
  local backups_count
  backups_count=$(find "$BACKUP_DIR" -name "maths_tutor_backup_*.db" | wc -l)

  if [ "$backups_count" -gt "$MAX_BACKUPS" ]; then
    local delete_count=$((backups_count - MAX_BACKUPS))
    echo -e "${YELLOW}Pruning $delete_count old backup file(s)...${NC}"
    
    find "$BACKUP_DIR" -name "maths_tutor_backup_*.db" -type f -printf '%T@ %p\n' \
      | sort -n \
      | head -n "$delete_count" \
      | cut -d' ' -f2- \
      | xargs rm -f
    
    echo -e "${GREEN}✓ Pruning complete. Keeping latest $MAX_BACKUPS backups.${NC}"
  else
    echo -e "${GREEN}✓ No pruning required (total backups: $backups_count/$MAX_BACKUPS).${NC}"
  fi
}

case "$1" in
  backup)
    backup_db
    ;;
  list)
    list_backups
    ;;
  restore)
    restore_db "$2"
    ;;
  prune)
    prune_backups
    ;;
  *)
    show_help
    exit 1
    ;;
esac
