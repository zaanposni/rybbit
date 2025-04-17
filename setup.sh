#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if domain name argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <domain_name>"
  echo "Example: $0 myapp.example.com"
  exit 1
fi

DOMAIN_NAME="$1"
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

EOL

echo ".env file created successfully with domain ${DOMAIN_NAME}."

# Build and start the Docker Compose stack
echo "Building and starting Docker services..."
docker compose up --build -d

echo "Setup complete. Services are starting in the background."
echo "You can monitor logs with: docker compose logs -f" 