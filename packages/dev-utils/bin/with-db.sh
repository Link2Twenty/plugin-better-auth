#!/usr/bin/env bash
# Starts the required docker-compose service for DATABASE_CLIENT, exports
# connection defaults, runs the given command, then stops the service —
# even on failure or Ctrl+C.
set -euo pipefail

COMPOSE_DIR="packages/dev-utils"
SERVICE=""

case "${DATABASE_CLIENT:-}" in
  postgres) SERVICE="postgres" ;;
  mysql)    SERVICE="mysql" ;;
esac

if [[ -n "$SERVICE" ]]; then
  export DATABASE_HOST="${DATABASE_HOST:-127.0.0.1}"
  export DATABASE_NAME="${DATABASE_NAME:-strapi}"
  export DATABASE_USERNAME="${DATABASE_USERNAME:-strapi}"
  export DATABASE_PASSWORD="${DATABASE_PASSWORD:-strapi}"
  case "$SERVICE" in
    postgres) export DATABASE_PORT="${DATABASE_PORT:-5432}" ;;
    mysql)    export DATABASE_PORT="${DATABASE_PORT:-3306}" ;;
  esac

  if [[ "${WITH_DB_SKIP_DOCKER:-}" != "1" ]]; then
    echo "[with-db] Starting $SERVICE..."
    docker compose --project-directory "$COMPOSE_DIR" up "$SERVICE" -d --wait
  fi
fi

cleanup() {
  if [[ -n "$SERVICE" && "${WITH_DB_SKIP_DOCKER:-}" != "1" ]]; then
    echo "[with-db] Stopping $SERVICE..."
    docker compose --project-directory "$COMPOSE_DIR" stop "$SERVICE"
  fi
}
trap cleanup EXIT

"$@"
