#!/usr/bin/env bash
set -euo pipefail

if [ -z "${SANDBOX_DB_NAME:-}" ]; then
  echo "SANDBOX_DB_NAME is not set. Skipping sandbox database creation." >&2
  exit 0
fi

existing_db=$(psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --tuples-only --quiet --no-align \
  --command "SELECT 1 FROM pg_database WHERE datname = '$SANDBOX_DB_NAME';")

if [[ -n "${existing_db// }" ]]; then
  echo "Database '$SANDBOX_DB_NAME' already exists. Skipping creation."
  exit 0
fi

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
CREATE DATABASE "$SANDBOX_DB_NAME" OWNER "$POSTGRES_USER";
EOSQL
