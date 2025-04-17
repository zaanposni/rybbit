#!/bin/sh
set -e

# Check if DOMAIN_NAME is set
if [ -z "${DOMAIN_NAME}" ]; then
  echo "Error: DOMAIN_NAME environment variable is not set." >&2
  exit 1
fi

# Generate dummy certs if real ones don't exist, so Nginx can start
if [ ! -f "/etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem" ]; then
  echo "Generating dummy SSL certificates for ${DOMAIN_NAME}..."
  mkdir -p /etc/letsencrypt/live/${DOMAIN_NAME}
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "/etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem" \
    -out "/etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem" \
    -subj "/CN=localhost"
fi

# Generate dhparams if not exists
if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
  echo "Generating DH parameters (2048 bits)... This may take a while."
  # Create the directory if it doesn't exist
  mkdir -p /etc/letsencrypt
  openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

# Substitute environment variables in the Nginx config template
# We need DOLLAR sign for Nginx variables like $host, $remote_addr etc.
export DOLLAR='$' 
export DOMAIN_NAME=${DOMAIN_NAME}
echo "Substituting variables in Nginx template..."
envsubst '${DOMAIN_NAME} ${DOLLAR}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Nginx configuration updated for ${DOMAIN_NAME}."

# Start a background process to periodically check for certificate updates and reload Nginx
(
  echo "Starting background certificate renewal checker..."
  while true; do
    # Sleep for 6 hours initially, then check more frequently if needed
    sleep 6h
    echo "[$(date)] Periodic Nginx reload check..."
    # Attempt to reload Nginx configuration gracefully
    # Nginx will only reload if the config test passes and certs are valid
    nginx -s reload
    echo "[$(date)] Nginx reload attempt finished."
  done
) &

# Execute the main Nginx process in the foreground
echo "Starting Nginx..."
exec nginx -g 'daemon off;' 