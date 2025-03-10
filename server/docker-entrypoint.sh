#!/bin/sh
set -e

# Docker Compose already ensures services are ready using healthchecks
# and dependency conditions in the docker-compose.yml file

# Run migrations explicitly using the npm script
echo "Running database migrations...."
npm run db:push

# Start the application
echo "Starting application..."
exec "$@" 