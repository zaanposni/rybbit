#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Restarting services..."

# Stop all services
docker compose stop

# Load environment variables
source .env

# Start the appropriate services
if [ "$USE_WEBSERVER" = "false" ]; then
  # Start without the caddy service when using --no-webserver
  docker compose start backend client clickhouse postgres
else
  # Start all services including caddy
  docker compose start
fi

echo "Services restarted. You can monitor logs with: docker compose logs -f" 