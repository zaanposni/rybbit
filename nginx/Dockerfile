FROM nginx:alpine

# Install openssl for dummy cert generation and dhparam
RUN apk add --no-cache openssl

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom config template and entrypoint script
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create directory for Certbot challenges and dhparams location
RUN mkdir -p /var/www/certbot /etc/letsencrypt

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"] 