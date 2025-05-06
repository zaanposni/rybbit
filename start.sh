#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting services..."

# Load environment variables
source .env

if [ "$USE_WEBSERVER" = "false" ]; then
  # Start without the caddy service when using --no-webserver
  docker compose start backend client clickhouse postgres
else
  # Start all services including caddy
  docker compose start
fi

echo "Services started. You can monitor logs with: docker compose logs -f" 