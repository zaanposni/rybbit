#!/bin/sh
set -e

echo 'Waiting for Nginx to start...' 
sleep 10s

# Determine Certbot email arguments
if [ -n "${CERTBOT_EMAIL}" ]; then
  email_arg="--email ${CERTBOT_EMAIL} --no-eff-email"
  echo "Using email ${CERTBOT_EMAIL} for Certbot."
else
  email_arg="--register-unsafely-without-email"
  echo "Warning: Running Certbot without an email address. You will not receive expiration notices."
fi

# Check if DOMAIN_NAME is set
if [ -z "${DOMAIN_NAME}" ]; then
  echo "Error: DOMAIN_NAME environment variable is not set." >&2
  exit 1
fi

echo "Attempting to obtain/renew certificate for ${DOMAIN_NAME}..."
# Initial certificate request
certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN_NAME} \
  ${email_arg} --agree-tos --keep-until-expiring --non-interactive \
  --rsa-key-size 4096 --preferred-challenges http-01 \
  || echo 'Initial certbot run failed or certificate already exists.'

echo "Starting Certbot renewal check loop..."
trap exit TERM

# Loop indefinitely for renewal checks
while true; do
  echo "[$(date)] Running certbot renew..."
  certbot renew --webroot -w /var/www/certbot --quiet
  # Sleep for 12 hours before next check
  sleep 12h & wait ${!}
done 