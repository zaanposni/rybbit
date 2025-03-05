# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Generate initial migrations if possible
RUN mkdir -p /app/drizzle
RUN npx drizzle-kit generate || echo "Skipping migration generation during build"

# Copy built application and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/docker-entrypoint.sh /docker-entrypoint.sh

# Make the entrypoint executable
RUN chmod +x /docker-entrypoint.sh

# Expose the API port
EXPOSE 3001

# Use our custom entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]