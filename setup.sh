#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Default values
USE_WEBSERVER="true"
NO_WEBSERVER_PORT_BACKEND="127.0.0.1:3001"
NO_WEBSERVER_PORT_CLIENT="127.0.0.1:3002"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --no-webserver) 
      USE_WEBSERVER="false"
      # When not using the built-in webserver, expose ports to host
      NO_WEBSERVER_PORT_BACKEND="3001:3001"
      NO_WEBSERVER_PORT_CLIENT="3002:3002"
      ;;
    *) DOMAIN_NAME="$1" ;;
  esac
  shift
done

# Check if domain name argument is provided
if [ -z "$DOMAIN_NAME" ]; then
  echo "Usage: $0 <domain_name> [--no-webserver]"
  echo "Example: $0 myapp.example.com"
  echo "Example with no webserver: $0 myapp.example.com --no-webserver"
  exit 1
fi

BASE_URL="https://${DOMAIN_NAME}"

# Generate a secure random secret for BETTER_AUTH_SECRET
# Uses OpenSSL if available, otherwise falls back to /dev/urandom
if command -v openssl &> /dev/null; then
    BETTER_AUTH_SECRET=$(openssl rand -hex 32)
elif [ -e /dev/urandom ]; then
    BETTER_AUTH_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
else
    echo "Error: Could not generate secure secret. Please install openssl or ensure /dev/urandom is available." >&2
    exit 1
fi

# Create or overwrite the .env file
echo "Creating .env file..."
cat > .env << EOL
# Variables configured by setup.sh
DOMAIN_NAME=${DOMAIN_NAME}
BASE_URL=${BASE_URL}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
DISABLE_SIGNUP=false
USE_WEBSERVER=${USE_WEBSERVER}
NO_WEBSERVER_PORT_BACKEND=${NO_WEBSERVER_PORT_BACKEND}
NO_WEBSERVER_PORT_CLIENT=${NO_WEBSERVER_PORT_CLIENT}
EOL

echo ".env file created successfully with domain ${DOMAIN_NAME}."
if [ "$USE_WEBSERVER" = "false" ]; then
  echo "Caddy webserver is disabled. You'll need to set up your own webserver."
  echo "The backend service will be available on port 3001 and the client on port 3002."
fi

# Build and start the Docker Compose stack
echo "Building and starting Docker services..."
if [ "$USE_WEBSERVER" = "false" ]; then
  # Start without the caddy service when using --no-webserver
  docker compose up --build -d backend client clickhouse postgres
else
  # Start all services including caddy
  docker compose up --build -d
fi

echo "Setup complete. Services are starting in the background."
echo "You can monitor logs with: docker compose logs -f" 