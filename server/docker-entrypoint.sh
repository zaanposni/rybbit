#!/bin/sh
set -e

# Run migrations explicitly using the npm script
echo "Running database migrations...."
npm run db:push

# Start the application
echo "Starting application..."
exec "$@" 