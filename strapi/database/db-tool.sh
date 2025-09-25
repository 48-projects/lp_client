#!/bin/bash
set -euo pipefail

# ==============================
#  Database Export/Import Tool
# ==============================

# This script lives in launchpad/strapi/database/
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STRAPI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$STRAPI_DIR/database/backups"

mkdir -p "$BACKUP_DIR"

# Load environment variables from .env
ENV_FILE="$STRAPI_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "⚠️  No .env file found at $ENV_FILE"
fi

# Defaults
ACTION=${1:-""}         # export | import
DB_TYPE=${2:-""}        # postgres | neon | sqlite
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

PG_DUMP_FILE="$BACKUP_DIR/${DB_TYPE}_dump_$TIMESTAMP.dump"
SQLITE_DUMP_FILE="$BACKUP_DIR/${DB_TYPE}_dump_$TIMESTAMP.sql"

# ==============================
#  Helpers
# ==============================

log() { echo -e "👉 $1"; }
success() { echo -e "✅ $1"; }
error() { echo -e "❌ $1"; exit 1; }

choose_action() {
  echo "Step 1: Choose action"
  select act in "export" "import"; do
    ACTION=$act; break
  done
}

choose_dbtype() {
  echo "Step 2: Choose database type"
  select db in "postgres" "neon" "sqlite"; do
    DB_TYPE=$db; break
  done
}

# ==============================
#  Postgres / Neon
# ==============================

export_postgres() {
  : "${DATABASE_NAME:?DATABASE_NAME not set in .env}"
  log "Exporting Postgres DB ($DATABASE_NAME)..."
  PGPASSWORD="$DATABASE_PASSWORD" pg_dump -U "$DATABASE_USERNAME" \
    -h "$DATABASE_HOST" -p "${DATABASE_PORT:-5432}" \
    -Fc -f "$PG_DUMP_FILE" "$DATABASE_NAME"
  success "Exported to $PG_DUMP_FILE"
}

import_postgres() {
  : "${DATABASE_NAME:?DATABASE_NAME not set in .env}"
  LATEST_DUMP=$(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -n 1 || true)
  [ -z "$LATEST_DUMP" ] && error "No .dump file found in $BACKUP_DIR"
  log "Importing $LATEST_DUMP into Postgres ($DATABASE_NAME)..."
  PGPASSWORD="$DATABASE_PASSWORD" pg_restore -U "$DATABASE_USERNAME" \
    -h "$DATABASE_HOST" -p "${DATABASE_PORT:-5432}" \
    -d "$DATABASE_NAME" --clean --if-exists "$LATEST_DUMP"
  success "Imported $LATEST_DUMP"
}

export_neon() { export_postgres; }
import_neon() { import_postgres; }

# ==============================
#  SQLite
# ==============================

DATABASE_FILENAME=${DATABASE_FILENAME:-"$STRAPI_DIR/.tmp/data.db"}

export_sqlite() {
  log "Exporting SQLite DB ($DATABASE_FILENAME)..."
  sqlite3 "$DATABASE_FILENAME" .dump > "$SQLITE_DUMP_FILE"
  success "Exported to $SQLITE_DUMP_FILE"
}

import_sqlite() {
  LATEST_SQL=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n 1 || true)
  [ -z "$LATEST_SQL" ] && error "No .sql file found in $BACKUP_DIR"
  log "Importing $LATEST_SQL into SQLite ($DATABASE_FILENAME)..."
  sqlite3 "$DATABASE_FILENAME" < "$LATEST_SQL"
  success "Imported $LATEST_SQL"
}

# ==============================
#  Main Logic
# ==============================

if [ -z "$ACTION" ]; then choose_action; fi
if [ -z "$DB_TYPE" ]; then choose_dbtype; fi

case "$DB_TYPE" in
  postgres) [ "$ACTION" == "export" ] && export_postgres || import_postgres ;;
  neon)     [ "$ACTION" == "export" ] && export_neon || import_neon ;;
  sqlite)   [ "$ACTION" == "export" ] && export_sqlite || import_sqlite ;;
  *)        error "Unsupported DB_TYPE: $DB_TYPE" ;;
esac
