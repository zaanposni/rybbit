#!/bin/sh
set -e

# Docker Compose already ensures services are ready using healthchecks
# and dependency conditions in the docker-compose.yml file

# Run migrations using our script (which handles existing tables)
echo "Initializing database..."
node dist/db/postgres/migrate.js || echo "Migration partially completed (this is normal for existing databases)"

# Start the application
echo "Starting application..."
exec "$@" 