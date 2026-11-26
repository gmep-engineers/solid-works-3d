# ==============================================================================
# Stage 1: Build NestJS Headless Backend (/api/v1/*)
# ==============================================================================
FROM node:20-slim AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Build Next.js 14 Web Storefront & Admin Portal
# ==============================================================================
FROM node:20-slim AS web-builder
WORKDIR /app/web

COPY web/package*.json ./
RUN npm install

COPY web/ ./
RUN npm run build

# ==============================================================================
# Stage 3: Unified Production Runtime for Google Cloud Run
# ==============================================================================
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    BACKEND_INTERNAL_URL=http://127.0.0.1:4000

# Copy NestJS Backend build & runtime dependencies
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/src/database/schema.sql ./backend/dist/database/schema.sql
COPY backend/.env* ./backend/

# Ensure uploads directories exist (mounted by GCS FUSE in Cloud Run)
RUN mkdir -p /app/backend/uploads/models /app/backend/uploads/thumbnails

# Copy Next.js Web build & runtime dependencies
COPY --from=web-builder /app/web/package*.json ./web/
COPY --from=web-builder /app/web/node_modules ./web/node_modules
COPY --from=web-builder /app/web/.next ./web/.next
COPY --from=web-builder /app/web/public ./web/public
COPY --from=web-builder /app/web/next.config.mjs ./web/next.config.mjs

# Create unified entrypoint that starts NestJS on 4000 and Next.js on $PORT (8080)
RUN printf '#!/bin/sh\nset -e\n\necho "[Levitate3D] Starting NestJS Backend API on port 4000..."\ncd /app/backend\nPORT=4000 node dist/main &\n\necho "[Levitate3D] Starting Next.js Storefront on port ${PORT:-8080}..."\ncd /app/web\nexec ./node_modules/.bin/next start -H 0.0.0.0 -p ${PORT:-8080}\n' > /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
