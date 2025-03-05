#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for databases to be ready..."
sleep 5

# Run migrations using our script (which handles existing tables)
echo "Initializing database..."
node dist/db/postgres/migrate.js || echo "Migration partially completed (this is normal for existing databases)"

# Start the application
echo "Starting application..."
exec "$@" 