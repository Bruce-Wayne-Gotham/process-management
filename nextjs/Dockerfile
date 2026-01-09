# Multi-stage Dockerfile for Next.js app
# 1) deps: install node_modules
# 2) builder: build Next.js
# 3) runner: production runtime

FROM node:18-bullseye AS deps
WORKDIR /app
COPY nextjs/package*.json ./
# Prefer npm ci if lockfile exists; fallback to npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:18-bullseye AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Database connection via DATABASE_URL (set in Render environment)
COPY --from=deps /app/node_modules ./node_modules
COPY nextjs/. .
RUN npm run build

FROM node:18-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Copy only what we need to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Copy database schema and init script for RDS setup
COPY sql ./sql
COPY render-setup/render-rds-init.js ./render-rds-init.js
# Install pg client for database initialization
RUN npm install pg --no-save
EXPOSE 3000
# Initialize RDS database (idempotent) then start app
CMD ["sh", "-c", "node render-rds-init.js && npm start"]