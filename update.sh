#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Updating to the latest version..."

# Pull latest changes from git repository
echo "Pulling latest code..."
git pull

# Stop running containers
echo "Stopping current services..."
docker compose down

# Rebuild and start containers
echo "Rebuilding and starting updated services..."

# Load environment variables
source .env

if [ "$USE_WEBSERVER" = "false" ]; then
  # Start without the caddy service when using --no-webserver
  docker compose up --build -d backend client clickhouse postgres
else
  # Start all services including caddy
  docker compose up --build -d
fi

echo "Update complete. Services are running with the latest version."
echo "You can monitor logs with: docker compose logs -f" 