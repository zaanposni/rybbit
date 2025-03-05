#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
PG_HOST="${DATABASE_HOST:-postgres}"
PG_PORT="${DATABASE_PORT:-5432}"
PG_MAX_RETRIES=30
PG_RETRIES=0

while [ $PG_RETRIES -lt $PG_MAX_RETRIES ]; do
  if pg_isready -h $PG_HOST -p $PG_PORT -q; then
    echo "PostgreSQL is ready!"
    break
  fi
  
  PG_RETRIES=$((PG_RETRIES+1))
  echo "Waiting for PostgreSQL... $PG_RETRIES/$PG_MAX_RETRIES"
  sleep 2
done

if [ $PG_RETRIES -eq $PG_MAX_RETRIES ]; then
  echo "PostgreSQL did not become ready in time, proceeding anyway..."
fi

# Wait for ClickHouse to be ready
echo "Waiting for ClickHouse..."
CH_HOST="${CLICKHOUSE_HOST:-clickhouse}"
CH_PORT="${CLICKHOUSE_HTTP_PORT:-8123}"
CH_MAX_RETRIES=15
CH_RETRIES=0

while [ $CH_RETRIES -lt $CH_MAX_RETRIES ]; do
  if curl -s "http://$CH_HOST:$CH_PORT/ping" | grep -q "Ok."; then
    echo "ClickHouse is ready!"
    break
  fi
  
  CH_RETRIES=$((CH_RETRIES+1))
  echo "Waiting for ClickHouse... $CH_RETRIES/$CH_MAX_RETRIES"
  sleep 2
done

if [ $CH_RETRIES -eq $CH_MAX_RETRIES ]; then
  echo "ClickHouse did not become ready in time, proceeding anyway..."
fi

# Run migrations using our script (which handles existing tables)
echo "Initializing database..."
node dist/db/postgres/migrate.js || echo "Migration partially completed (this is normal for existing databases)"

# Start the application
echo "Starting application..."
exec "$@" 